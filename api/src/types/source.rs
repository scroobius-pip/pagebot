use std::{
    hash::{Hash, Hasher},
    ops::Deref,
    sync::{Arc, Mutex},
};

use crate::{
    db::DB,
    embed_pool::{Embedding, EMBED_POOL},
};
use axum::http::HeaderValue;
use eyre::{Report, Result};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_aux::prelude::deserialize_number_from_string;
use unicode_segmentation::UnicodeSegmentation;
use url_serde::SerdeUrl;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SourceInput {
    content: Option<String>,
    url: Option<SerdeUrl>,
    #[serde(
        default = "default_expires",
        deserialize_with = "deserialize_number_from_string"
    )]
    expires: u32,
}

fn default_expires() -> u32 {
    86400 // 1 day
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Source {
    // pub content: String,
    pub url: String,
    pub expires: u32,
    pub created_at: u32,
    pub chunks: Chunks,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Chunks {
    pub url: String,
    pub value: (Vec<String>, Vec<Embedding>), // (sentence, embedding)
}

#[derive(Debug)]
enum RemoteSourceType {
    Pdf,
    Html,
    Json,
    Text,
}

#[derive(Debug)]
pub enum SourceError {
    ContentEmpty(String),
    Default(Report),
}

impl Source {
    pub fn by_url(url: &str) -> Result<Option<Source>> {
        let source = DB.source_cache(url.trim())?;
        Ok(source)
    }

    pub fn save(&self) -> Result<Self> {
        let source = DB.source_cache_save(self.clone())?;
        Ok(source)
    }

    pub fn content(&self) -> String {
        self.chunks.value.0.join(" ")
    }

    async fn fetch(url: SerdeUrl) -> Result<String> {
        let url = url.to_string();
        let resp = reqwest::get(url).await?;
        let remote_type: RemoteSourceType = resp.headers().get("content-type").into();
        log::info!("Remote type: {:?}", remote_type);
        let content = match remote_type {
            RemoteSourceType::Pdf => {
                let content_bytes = resp.bytes().await?;
                pdf_extract::extract_text_from_mem(&content_bytes)?
            }
            RemoteSourceType::Html => {
                let mut content: String = Default::default();

                let selector_str: &str =
                    "h1, h2, h3, h4, h5, h6, p, a, span, div, li, ul, ol, blockquote, pre, code";

                let selector =
                    Selector::parse(selector_str).map_err(|_| eyre::eyre!("Invalid selector"))?;
                let body = resp.text().await?;
                let document = Html::parse_document(&body);
                for element in document.select(&selector) {
                    content.push_str(element.text().collect::<Vec<_>>().join("\n").as_str());
                }
                content
            }
            _ => resp.text().await?,
        };

        if content.is_empty() {
            Ok("CONTENT_EMPTY".to_string())
        } else {
            Ok(content)
        }
    }

    pub async fn new(input: SourceInput) -> Result<(Self, bool), SourceError> {
        let mut retrieved: bool = false;
        log::info!("Source input: {:?}", input);
        if input.content.is_none() && input.url.is_none() {
            // return Err(eyre::eyre!("No content or url provided"));
            return Err(SourceError::Default(eyre::eyre!(
                "No content or url provided"
            )));
        }

        // If there's no URL, we're dealing with a local source not from the requesting website.
        if input.url.is_none() && input.content.is_some() {
            log::info!("No URL provided, using content as URL");
            let mut hasher = ahash::AHasher::default();
            input.content.as_ref().unwrap().hash(&mut hasher);
            let content_hash = format!("_{}", hasher.finish());
            let cached_source = Source::by_url(content_hash.as_str())
                .map_err(|e| SourceError::Default(e))?
                .filter(|source| {
                    !source.is_expired()
                        && source.content() == input.content.as_ref().unwrap().as_str()
                });

            match cached_source {
                Some(source) => {
                    return Ok((source, retrieved));
                }
                _ => {
                    retrieved = true; // we're retrieving this source
                    return Ok((
                        Source {
                            url: content_hash,
                            expires: input.expires,
                            created_at: chrono::Utc::now().timestamp() as u32,
                            chunks: Chunks::new(input.content.unwrap_or("".to_string()), "")
                                .await
                                .map_err(|e| SourceError::Default(e))?,
                        }
                        .save()
                        .map_err(|e| SourceError::Default(e))?,
                        retrieved,
                    ));
                }
            }
        }

        let input_url = input.url.clone().unwrap();

        // If the URL is localhost, don't retrieve it or save it.
        if Self::is_local_url(input_url.as_str()) {
            return Ok((
                Source {
                    // content: input.content.unwrap_or("".to_string()),
                    url: input_url.to_string(),
                    expires: input.expires,
                    created_at: chrono::Utc::now().timestamp() as u32,
                    chunks: Chunks::new(
                        input.content.unwrap_or("".to_string()),
                        input_url.as_str(),
                    )
                    .await
                    .map_err(|e| SourceError::Default(e))?,
                    // ..Default::default()
                },
                retrieved,
            ));
        }

        let source = match input.content {
            Some(content) => Source {
                // content,
                url: input_url.to_string(),
                expires: input.expires,
                created_at: chrono::Utc::now().timestamp() as u32,
                chunks: Chunks::new(content, input_url.as_str())
                    .await
                    .map_err(|e| SourceError::Default(e))?,
            }
            .save()
            .map_err(|e| SourceError::Default(e))?,
            _ => {
                let cached_source = Source::by_url(input_url.as_str())
                    .map_err(|e| SourceError::Default(e))?
                    .filter(|source| !source.is_expired());

                match cached_source {
                    Some(source) => source,
                    _ => {
                        retrieved = true; // we're retrieving this source
                        let content = Self::fetch(input_url.clone())
                            .await
                            .map_err(|e| SourceError::Default(e))?;
                        if content == "CONTENT_EMPTY" {
                            return Err(SourceError::ContentEmpty(input_url.to_string()));
                        }

                        let source = Self {
                            // content: content.clone(),
                            url: input_url.to_string(),
                            expires: input.expires,
                            created_at: chrono::Utc::now().timestamp() as u32,
                            chunks: Chunks::new(content, input_url.as_str())
                                .await
                                .map_err(|e| SourceError::Default(e))?,
                        };
                        source.save().map_err(|e| SourceError::Default(e))?
                    }
                }
            }
        };

        Ok((source, retrieved))
    }

    pub fn is_expired(&self) -> bool {
        self.expires_timestamp() < chrono::Utc::now().timestamp() as u32
    }

    pub fn expires_timestamp(&self) -> u32 {
        self.created_at + self.expires
    }

    fn is_local_url(url: &str) -> bool {
        url.contains("localhost") || url.contains("127.0.0.1")
    }
}

impl From<Option<&HeaderValue>> for RemoteSourceType {
    fn from(header: Option<&HeaderValue>) -> Self {
        match header {
            Some(header) => {
                let header = header.to_str().unwrap_or("");
                if header.contains("pdf") {
                    Self::Pdf
                } else if header.contains("html") {
                    Self::Html
                } else if header.contains("json") {
                    Self::Json
                } else {
                    Self::Text
                }
            }
            None => Self::Text,
        }
    }
}

impl Chunks {
    const CHUNK_SIZE: usize = 5;
    pub async fn new(content: String, url: &str) -> Result<Self> {
        if content.is_empty() || url.is_empty() {
            return Err(eyre::eyre!("Content or URL is empty"));
        }

        let unchunked_sentences = content.unicode_sentences().collect::<Vec<_>>();
        let chunked_sentences = unchunked_sentences.chunks(Self::CHUNK_SIZE);

        let chunked_sentences = chunked_sentences
            .map(|chunk| chunk.join(" "))
            .collect::<Vec<_>>();

        let (sender, receiver) = tokio::sync::oneshot::channel();
        let chunked_sentences = Arc::new(chunked_sentences);
        let _chunked_sentences = chunked_sentences.clone();

        let instant_now = std::time::Instant::now();

        rayon::spawn(move || {
            let embeddings = EMBED_POOL.encode(_chunked_sentences.to_vec());
            _ = sender.send(embeddings);
        });

        let embeddings = receiver
            .await
            .map_err(|_| eyre::eyre!("Failed to receive embeddings"))??;

        log::info!(
            "Embeddings took {:?} for {}",
            instant_now.elapsed(),
            content.len()
        );

        assert_eq!(
            chunked_sentences.len(),
            embeddings.len(),
            "Chunked sentences and embeddings should be the same length"
        );

        Ok(Self {
            url: url.to_string(),
            value: (chunked_sentences.to_vec(), embeddings),
        })
    }

    pub async fn query(query: String) -> Result<Vec<f32>> {
        let instant_now = std::time::Instant::now();
        let (sender, receiver) = tokio::sync::oneshot::channel();

        rayon::spawn(move || {
            let embeddings = EMBED_POOL.encode(vec![query]);
            _ = sender.send(embeddings.map(|e| e[0].clone()));
            println!("Query embedding took {:?}", instant_now.elapsed());
        });

        receiver
            .await
            .map_err(|_| eyre::eyre!("Failed to receive embeddings"))?
    }
}

// pub trait Source {
//     fn content(&self) -> String;
// }

#[cfg(test)]
mod tests {
    use unicode_segmentation::UnicodeSegmentation;
    use url_serde::De;

    use super::*;

    #[test]
    fn local_url() {
        assert!(Source::is_local_url("http://localhost:3000"));
        assert!(Source::is_local_url("localhost:3000"));
        assert!(Source::is_local_url("127.0.0.1"));
        assert!(Source::is_local_url("http://127.0.0.1:3000"));
    }

    #[tokio::test]
    async fn source_errors() {
        let input = SourceInput {
            content: None,
            url: None,
            expires: 86400,
        };
        assert!(Source::new(input).await.is_err());
    }

    #[tokio::test]
    async fn with_content() {
        let input = SourceInput {
            content: Some("Hello world".to_string()),
            url: None,
            expires: 86400,
        };
        assert!(Source::new(input).await.is_ok());
    }

    #[tokio::test]
    async fn with_url() {
        let google_url: SerdeUrl = serde_json::from_str("\"https://google.com\"").expect("url");
        let input = SourceInput {
            content: None,
            url: Some(google_url),
            expires: 86400,
        };
        assert!(Source::new(input).await.is_ok());
    }

    #[tokio::test]
    async fn html_content_should_be_parsed() {
        let nextui_url: SerdeUrl =
            serde_json::from_str("\"https://nextui.org/docs/getting-started\"").expect("url");
        // let google_url: SerdeUrl = serde_json::from_str("\"https://google.com\"").expect("url");
        let input = SourceInput {
            content: None,
            url: Some(nextui_url),
            expires: 86400,
        };
        let (source, _) = Source::new(input).await.expect("source");

        // assert!(!source.content.contains("<html"));
    }

    #[tokio::test]
    async fn pdf_content_should_be_parsed() {
        let w3 = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        let pdf_url: SerdeUrl = serde_json::from_str(format!("\"{}\"", w3).as_str()).expect("url");
        let input = SourceInput {
            content: None,
            url: Some(pdf_url),
            expires: 86400,
        };
        let (source, _) = Source::new(input).await.expect("source");
        println!("{:?}", source);
        // assert!(source.content.contains("Dummy"));
    }

    #[tokio::test]
    async fn fetch_json() {
        // shiro.nohara111@gmail.com
        let st = "https://api.arible.co/user_admin/shiro.nohara111@gmail.com?auth_token=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgxMjg2NjAxLCJzdWIiOiI2ZGYwZmMwMC1hZWFjLTQyMmItODllNi1jOWNkNjkxNTZkYjciLCJlbWFpbCI6ImNoaXNpbWRpcmkuZWppbmtlb255ZUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIiwiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BR05teXhZWENpWUJFRXlETWFabm1FdVNlSW5ja0cwajE1THRfN0cyTTRoaT1zOTYtYyIsImVtYWlsIjoiY2hpc2ltZGlyaS5lamlua2VvbnllQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJDaGlzaW1kaXJpIEVqaW5rZW9ueWUiLCJpc3MiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS91c2VyaW5mby92Mi9tZSIsIm5hbWUiOiJDaGlzaW1kaXJpIEVqaW5rZW9ueWUiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUdObXl4WVhDaVlCRUV5RE1hWm5tRXVTZUluY2tHMGoxNUx0XzdHMk00aGk9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwOTUyNDg4MDQzODEwMTMxMjE5NSIsInN1YiI6IjEwOTUyNDg4MDQzODEwMTMxMjE5NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNjgxMjY0MzE2fV0sInNlc3Npb25faWQiOiIzYTUyZDFjZi00MDE1LTRlOTAtOTEyZS1iYzZkMTFhZDZlMWUifQ.nF5OFgwR4DPV8nXJ2iQ4uWhLFCkHfZNquwqbwVX5y84";
        let url: SerdeUrl = serde_json::from_str(format!("\"{}\"", st).as_str()).expect("url");

        let source = Source::fetch(url).await.expect("source");
        println!("{:?}", source);
    }
}
