use std::hash::{Hash, Hasher};

use crate::{
    db::DB,
    embed_pool::{Embedding, EMBED_POOL},
};
use axum::http::HeaderValue;
use docx_rust::document::{ParagraphContent, RunContent};
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
    pub uri: String,
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
    DOCX,
}

#[derive(Debug)]
pub enum SourceError {
    ContentEmpty(String),
    Default(Report),
}
const MIN_CONTENT_LENGTH: usize = 100;

impl Source {
    pub fn by_url(url: &str) -> Result<Option<Source>> {
        let source = DB.source_cache(url.trim())?;
        Ok(source)
    }

    pub fn save(&self) -> Result<Self> {
        let source = DB.source_cache_save(self.clone())?;
        Ok(source)
    }

    pub fn delete(&self) -> Result<()> {
        DB.source_cache_delete(self.uri.as_str().trim())?;
        Ok(())
    }

    pub fn content(&self) -> String {
        self.chunks.value.0.join(" ")
    }

    fn parse_html(html: String) -> String {
        let selector_str: &str =
            "h1, h2, h3, h4, h5, h6, p, a, span, div, li, ul, ol, blockquote, pre, code";

        let selector = Selector::parse(selector_str).expect("Invalid selector"); // TODO: handle error
        let document = Html::parse_document(html.as_ref());
        let mut content = String::new();
        for element in document.select(&selector) {
            let contents = element
                .text()
                .chain(std::iter::once(element.value().attr("href").unwrap_or("")))
                .collect::<Vec<_>>()
                .join("\n");

            content.push_str(contents.as_str());
        }
        content
    }

    async fn fetch(url: SerdeUrl) -> Result<String> {
        let url = url.to_string();
        let resp = reqwest::get(&url).await?;
        let remote_type: RemoteSourceType = resp.headers().get("content-type").into();

        let content = match remote_type {
            RemoteSourceType::Pdf => {
                let content_bytes = resp.bytes().await?;
                pdf_extract::extract_text_from_mem(&content_bytes)?
            }
            RemoteSourceType::Html => {
                let body = resp.text().await?;
                let content = Self::parse_html(body);
                if content.len() < MIN_CONTENT_LENGTH {
                    //try server rendered version
                    let scraper_api_url = format!(
                        "http://api.scraperapi.com?api_key={}&url={}&render=true",
                        dotenv!("SCRAPER_API_KEY"),
                        url
                    );

                    let resp = reqwest::get(scraper_api_url).await?;
                    let body = resp.text().await?;

                    Self::parse_html(body)
                } else {
                    content
                }
            }
            RemoteSourceType::DOCX => {
                let content_bytes = resp.bytes().await?;
                let buffer = std::io::Cursor::new(content_bytes);

                let docx_file = docx_rust::DocxFile::from_reader(buffer)
                    .map_err(|_| eyre::eyre!("Failed to read docx"))?;

                let parsed = docx_file
                    .parse()
                    .map_err(|_| eyre::eyre!("Failed to parse docx"))?;

                let document = parsed.document;

                let content = document
                    .body
                    .content
                    .into_iter()
                    .flat_map(|content| match content {
                        docx_rust::document::BodyContent::Paragraph(paragraph) => {
                            let contents =
                                paragraph
                                    .content
                                    .into_iter()
                                    .flat_map(|content| match content {
                                        ParagraphContent::Run(run) => run
                                            .content
                                            .into_iter()
                                            .map(|content| match content {
                                                RunContent::Text(text) => text.text.to_string(),
                                                RunContent::Break(_) => "\n".to_string(),
                                                _ => "".to_string(),
                                            })
                                            .collect::<Vec<String>>(),

                                        ParagraphContent::Link(link) => link
                                            .content
                                            .content
                                            .into_iter()
                                            .map(|content| match content {
                                                RunContent::Text(text) => text.text.to_string(),
                                                RunContent::Break(_) => "\n".to_string(),
                                                _ => "".to_string(),
                                            })
                                            .collect::<Vec<String>>(),
                                        _ => vec![],
                                    });
                            contents.collect::<Vec<_>>()
                        }
                        _ => vec![],
                    });

                //merge iterator of strings into one string seperated by newlines
                content.collect::<Vec<_>>().join("")
            }
            _ => resp.text().await?,
        };

        Ok(content)
    }

    pub async fn new(input: SourceInput) -> Result<(Self, bool), SourceError> {
        let mut retrieved: bool = false;

        if input.content.is_none() && input.url.is_none() {
            // return Err(eyre::eyre!("No content or url provided"));
            return Err(SourceError::Default(eyre::eyre!(
                "No content or url provided"
            )));
        }

        // If there's no URL, we're dealing with a local source not from the requesting website.
        if input.url.is_none() && input.content.is_some() {
            //we store the raw text to avoid having to recompute the embeddings
            let mut hasher = ahash::AHasher::default();
            input.content.as_ref().unwrap().hash(&mut hasher);
            let content_hash = format!("_{}", hasher.finish());
            let cached_source = Source::by_url(content_hash.as_str())
                .map_err(SourceError::Default)?
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
                            uri: content_hash,
                            expires: input.expires,
                            created_at: chrono::Utc::now().timestamp() as u32,
                            chunks: Chunks::new(input.content.unwrap_or("".to_string()), "")
                                .await
                                .map_err(SourceError::Default)?,
                        }
                        .save()
                        .map_err(SourceError::Default)?,
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
                    uri: input_url.to_string(),
                    expires: input.expires,
                    created_at: chrono::Utc::now().timestamp() as u32,
                    chunks: Chunks::new(
                        input.content.unwrap_or("".to_string()),
                        input_url.as_str(),
                    )
                    .await
                    .map_err(SourceError::Default)?,
                    // ..Default::default()
                },
                retrieved,
            ));
        }

        let source = match input.content {
            Some(content) => Source {
                // content,
                uri: input_url.to_string(),
                expires: input.expires,
                created_at: chrono::Utc::now().timestamp() as u32,
                chunks: Chunks::new(content, input_url.as_str())
                    .await
                    .map_err(SourceError::Default)?,
            }
            .save()
            .map_err(SourceError::Default)?,
            _ => {
                let cached_source = Source::by_url(input_url.as_str())
                    .map_err(SourceError::Default)?
                    .filter(|source| !source.is_expired());

                match cached_source {
                    Some(source) => source,
                    _ => {
                        retrieved = true; // we're retrieving this source
                        let content = Self::fetch(input_url.clone())
                            .await
                            .map_err(SourceError::Default)?;
                        if content.is_empty() {
                            return Err(SourceError::ContentEmpty(input_url.to_string()));
                        }

                        let source = Self {
                            // content: content.clone(),
                            uri: input_url.to_string(),
                            expires: input.expires,
                            created_at: chrono::Utc::now().timestamp() as u32,
                            chunks: Chunks::new(content, input_url.as_str())
                                .await
                                .map_err(SourceError::Default)?,
                        };
                        source.save().map_err(SourceError::Default)?
                    }
                }
            }
        };

        Ok((source, retrieved))
    }

    pub fn is_expired(&self) -> bool {
        let expired = self.expires_timestamp() < chrono::Utc::now().timestamp() as u32;
        if expired {
            self.delete().expect("Failed to delete source");
        };
        expired
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
                } else if header.contains(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ) {
                    Self::DOCX
                } else {
                    Self::Text
                }
            }
            None => Self::Text,
        }
    }
}

impl Chunks {
    const CHUNK_SIZE: usize = 20;
    pub async fn new(content: String, url: &str) -> Result<Self> {
        if content.is_empty() {
            return Err(eyre::eyre!("Content is empty"));
        }

        let unchunked_sentences = content.unicode_sentences().collect::<Vec<_>>();
        //@todo: chunk by sentence length
        let chunked_sentences = unchunked_sentences.chunks(Self::CHUNK_SIZE);

        let chunked_sentences = chunked_sentences
            .map(|chunk| chunk.join(" "))
            .collect::<Vec<_>>();

        let _chunked_sentences = chunked_sentences.clone();

        let embeddings = EMBED_POOL
            .encode(_chunked_sentences)
            .await
            .map_err(|_| eyre::eyre!("Failed to receive embeddings"))?;

        Ok(Self {
            url: url.to_string(),
            value: (chunked_sentences, embeddings),
        })
    }

    pub async fn query(query: String) -> Result<Vec<f32>> {
        EMBED_POOL.encode(vec![query]).await.map(|e| e[0].clone())
    }
}

// pub trait Source {
//     fn content(&self) -> String;
// }

#[cfg(test)]
mod tests {

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
        assert!(source.contains("credits"));
    }

    #[tokio::test]
    async fn raw_content() {
        let input = SourceInput {
            content: Some("Hello world".to_string()),
            url: None,
            expires: 86400,
        };
        let (source, _) = Source::new(input).await.expect("source");
        assert_eq!(source.content(), "Hello world");
    }
}
