use crate::db::DB;
use axum::http::HeaderValue;
use eyre::Result;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_aux::prelude::deserialize_number_from_string;
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
    pub content: String,
    pub url: String,
    pub expires: u32,
    pub created_at: u32,
}

#[derive(Debug)]
enum RemoteSourceType {
    Pdf,
    Html,
    Json,
    Text,
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

    async fn fetch(url: SerdeUrl) -> Result<String> {
        let url = url.to_string();
        let resp = reqwest::get(url).await?;
        let remote_type: RemoteSourceType = resp.headers().get("content-type").into();
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
        Ok(content)
    }

    pub async fn new(input: SourceInput) -> Result<(Self, bool)> {
        let mut retrieved: bool = false;

        if input.content.is_none() && input.url.is_none() {
            return Err(eyre::eyre!("No content or url provided"));
        }

        // If there's no URL, we're dealing with a local source, no need to retrieve it or save it
        if input.url.is_none() {
            return Ok((
                Source {
                    content: input.content.unwrap_or("".to_string()),
                    url: "".to_string(),
                    expires: input.expires,
                    created_at: chrono::Utc::now().timestamp() as u32,
                },
                retrieved,
            ));
        }

        let input_url = input.url.clone().unwrap();

        // If the URL is localhost, don't retrieve it or save it.
        if Self::is_local_url(input_url.as_str()) {
            return Ok((
                Source {
                    content: input.content.unwrap_or("".to_string()),
                    url: input_url.to_string(),
                    expires: input.expires,
                    created_at: chrono::Utc::now().timestamp() as u32,
                },
                retrieved,
            ));
        }

        let source = match input.content {
            Some(content) => Source {
                content,
                url: input_url.to_string(),
                expires: input.expires,
                created_at: chrono::Utc::now().timestamp() as u32,
            }
            .save()?,
            _ => {
                let cached_source =
                    Source::by_url(input_url.as_str())?.filter(|source| !source.is_expired());

                match cached_source {
                    Some(source) => source,
                    _ => {
                        retrieved = true; // we're retrieving this source
                        let content = Self::fetch(input_url.clone()).await?;
                        let source = Self {
                            content: content.clone(),
                            url: input_url.to_string(),
                            expires: input.expires,
                            created_at: chrono::Utc::now().timestamp() as u32,
                        };
                        source.save()?
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

// pub trait Source {
//     fn content(&self) -> String;
// }

#[cfg(test)]
mod tests {
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

        assert!(!source.content.contains("<html"));
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
        assert!(source.content.contains("Dummy"));
    }
}
