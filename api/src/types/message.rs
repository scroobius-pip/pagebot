use std::sync::Arc;

use crate::{
    notification::{Notification, NotificationType},
    types::source::SourceError,
};

use super::{
    source::{Chunks, Source, SourceInput},
    usage::{Usage, UsageItem},
};
use eyre::Result;
use futures::future::join_all;
use hnsw_rs::prelude::{DistCosine, Hnsw};
use serde::{Deserialize, Serialize};
use serde_aux::field_attributes::deserialize_number_from_string;
use url_serde::SerdeUrl;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    #[serde(deserialize_with = "deserialize_number_from_string")]
    pub user_id: u64, //user id
    pub sources: Vec<SourceInput>,
    pub query: String,
    pub page_url: SerdeUrl,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluatedMessage {
    pub user_id: u64,
    pub merged_sources: String,
    pub retrieval_count: u16,
    pub token_count: usize,
    pub query: String,
    pub page_url: String,
}

impl Message {
    pub async fn evaluate(self, notification: Arc<Notification>) -> Result<EvaluatedMessage> {
        let pending_sources = self.sources.into_iter().map(Source::new);

        let query_embedding = Chunks::query(self.query.clone()).await?;

        let ((contents, embeddings), retrieval_count, token_count) =
            join_all(pending_sources).await.into_iter().fold(
                ((vec![], vec![]), 0, 0),
                |((mut contents, mut embeddings), retrieval_count, token_count), source| {
                    match source {
                        Ok((mut source, retrieved)) => {
                            let token_count = token_count + count_tokens(&source.content());

                            contents.append(&mut source.chunks.value.0);
                            embeddings.append(&mut source.chunks.value.1);

                            (
                                (contents, embeddings),
                                retrieval_count + retrieved as u16,
                                token_count,
                            )
                        }

                        Err(e) => {
                            match e {
                                SourceError::ContentEmpty(url) => {
                                    let _notification = notification.clone();
                                    tokio::spawn(async move {
                                      _ = _notification.send(NotificationType::User(format!(
                                            "Content empty at: {}, please check this source, if this url is a client side rendered webpage, you'll need to use a server rendered version of the page.",
                                            url
                                        ))).await;
                                    });
                                }
                                SourceError::Default(e) => {
                                    log::error!("Failed to get source: {}", e);
                                }
                            }
                            ((contents, embeddings), retrieval_count, token_count)
                        }
                    }
                },
            );

        let mut token_count = token_count + count_tokens(&self.query);

        //5% error margin
        token_count = token_count + (token_count / 20);

        log::info!("embeddings count: {}", embeddings.len());

        let similar_content_index = top_similar_indexes(embeddings, &query_embedding);

        let merged_similar_content = similar_content_index.iter().map(|i| &contents[*i]).fold(
            String::with_capacity(contents.len() * contents[0].len()),
            |mut acc, content| {
                acc.push_str(content);
                acc.push('\n');
                acc
            },
        );

        Ok(EvaluatedMessage {
            user_id: self.user_id,
            merged_sources: merged_similar_content,
            retrieval_count,
            token_count,
            query: self.query,
            page_url: self.page_url.to_string(),
        })
    }
}

impl From<EvaluatedMessage> for UsageItem {
    fn from(message: EvaluatedMessage) -> Self {
        let source_word_count = message
            .merged_sources
            .split_whitespace()
            .collect::<Vec<&str>>()
            .len();

        Self {
            message_count: 1,
            source_word_count: source_word_count as u32,
            source_retrieval_count: message.retrieval_count,
            page_url: message.page_url,
            submitted: false,
            usage_id: Usage::current_id(message.user_id),
            user_id: message.user_id,
        }
    }
}

impl From<&EvaluatedMessage> for UsageItem {
    fn from(message: &EvaluatedMessage) -> Self {
        let source_word_count = message
            .merged_sources
            .split_whitespace()
            .collect::<Vec<&str>>()
            .len();

        Self {
            message_count: 1,
            source_word_count: source_word_count as u32,
            source_retrieval_count: message.retrieval_count,
            page_url: message.page_url.clone(),
            submitted: false,
            usage_id: Usage::current_id(message.user_id),
            user_id: message.user_id,
        }
    }
}

impl From<Arc<EvaluatedMessage>> for UsageItem {
    fn from(message: Arc<EvaluatedMessage>) -> Self {
        let source_word_count = message
            .merged_sources
            .split_whitespace()
            .collect::<Vec<&str>>()
            .len();

        Self {
            message_count: 1,
            source_word_count: source_word_count as u32,
            source_retrieval_count: message.retrieval_count,
            page_url: message.page_url.clone(),
            submitted: false,
            usage_id: Usage::current_id(message.user_id),
            user_id: message.user_id,
        }
    }
}

pub fn count_tokens(text: &str) -> usize {
    let mut tokens = 0;
    let mut chars = 0;
    let mut prev_whitespace = true;

    for ch in text.chars() {
        if ch.is_whitespace() && ch != '\n' {
            prev_whitespace = true;
        } else {
            if prev_whitespace {
                tokens += (chars + 1) / 4; // +1 to include the space
                chars = 0;
                prev_whitespace = false;
            }

            if ch.is_alphanumeric() || ch == '_' {
                chars += 1;
            } else {
                tokens += (chars + 1) / 4; // +1 to include the space
                chars = 0;
                tokens += 1; // Special character as a separate token
            }
        }
    }

    tokens += (chars + 1) / 4; // +1 to include the space

    tokens
}

pub fn top_similar_indexes(embeddings: Vec<Vec<f32>>, query: &[f32]) -> Vec<usize> {
    let instant = std::time::Instant::now();
    let hnsw = Hnsw::new(5, embeddings.len(), 16, 50, DistCosine);
    let embedding_w_index: Vec<(&Vec<f32>, usize)> = embeddings
        .iter()
        .enumerate()
        .map(|(i, embedding)| (embedding, i))
        .collect();
    hnsw.parallel_insert(&embedding_w_index);
    let neighbours = hnsw.search(query, 50, 80);
    log::info!("hnsw search took {:?}", instant.elapsed());
    neighbours
        .into_iter()
        .map(|n| n.d_id)
        .collect::<Vec<usize>>()
}
