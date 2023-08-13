use axum::http::HeaderValue;
use eyre::Result;
use serde::{Deserialize, Serialize};
use serde_aux::prelude::deserialize_number_from_string;
use url_serde::SerdeUrl;

use crate::db::DB;

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
        // Extract the host part of the URL

        let host_start = url.find("://").map(|pos| pos + 3).unwrap_or(0);
        let host_end = url[host_start..]
            .find('/')
            .map(|pos| pos + host_start)
            .unwrap_or_else(|| url.len());
        let host = &url[host_start..host_end];

        // Check if the host is "localhost" or "127.0.0.1"
        host == "localhost" || host.starts_with("127.0.0.1")
    }
}

impl From<Option<&HeaderValue>> for RemoteSourceType {
    fn from(header: Option<&HeaderValue>) -> Self {
        match header {
            Some(header) => {
                let header = header.to_str().unwrap_or("");
                match header {
                    "application/pdf" => Self::Pdf,
                    "text/html" => Self::Html,
                    "application/json" => Self::Json,
                    "text/plain" => Self::Text,
                    _ => Self::Text,
                }
            }
            None => Self::Text,
        }
    }
}

// pub trait Source {
//     fn content(&self) -> String;
// }
