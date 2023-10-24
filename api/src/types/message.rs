use std::sync::Arc;

use crate::{
    notification::{Notification, NotificationType},
    types::source::SourceError,
};

use super::{
    perf::Perf,
    source::{Chunks, Source, SourceInput},
    usage::{Usage, UsageItem},
};
use eyre::Result;
use futures::future::join_all;
use hnsw_rs::prelude::{DistCosine, Hnsw};
use itertools::Itertools;
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

#[derive(Debug, Clone, Default)]
pub struct EvaluatedMessage {
    pub user_id: u64,
    pub merged_sources: String,
    pub retrieval_count: u16,
    pub token_count: usize,
    pub query: String,
    pub page_url: String,
    pub perf: Perf,
}

const NEIGHBOUR_COUNT: usize = 2;
impl Message {
    pub async fn evaluate(self, notification: Arc<Notification>) -> Result<EvaluatedMessage> {
        let instant_now = std::time::Instant::now();

        let source_inputs = self.sources.into_iter().map(SourceInput::process);
        let processed_source_inputs = join_all(source_inputs)
            .await
            .into_iter()
            .filter_map(|source_input| source_input.ok())
            .flatten();

        let pending_sources = processed_source_inputs.map(Source::new);
        let sources = join_all(pending_sources).await;

        let retrieval_time = instant_now.elapsed().as_millis();
        let query_embedding = Chunks::query(self.query.clone()).await?;

        let mut cached = true;
        let ((contents, embeddings), retrieval_count, token_count) = sources.into_iter().fold(
            ((vec![], vec![]), 0, 0),
            |((mut contents, mut embeddings), retrieval_count, token_count), source| match source {
                Ok((mut source, retrieved)) => {
                    let token_count = token_count + count_tokens(&source.content());

                    contents.append(&mut source.chunks.value.0);
                    embeddings.append(&mut source.chunks.value.1);

                    if retrieved {
                        cached = false;
                    }

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
                                _ = _notification.send(NotificationType::SourceError(url)).await;
                            });
                        }
                        SourceError::Default(e) => {
                            log::error!("Failed to get source: {}", e);
                        }
                    }
                    ((contents, embeddings), retrieval_count, token_count)
                }
            },
        );
        let embedding_time = instant_now.elapsed().as_millis() - retrieval_time;

        let mut token_count = token_count + count_tokens(&self.query);

        //5% error margin
        token_count = token_count + (token_count / 20);

        let embeddings_count = embeddings.len();

        let similar_content_index = top_similar_indexes(embeddings, &query_embedding, 50);
        let similar_content_index_with_neighbours_index = similar_content_index
            .iter()
            // get all neighbours of indexes (left and right, including self)
            .flat_map(|&index| {
                let left = index.saturating_sub(NEIGHBOUR_COUNT);
                let right = index + NEIGHBOUR_COUNT;
                left..=right.min(embeddings_count - 1)
            })
            .unique();

        let merged_similar_content = similar_content_index_with_neighbours_index
            .map(|i| &contents[i])
            .fold(
                String::with_capacity(contents.len() * contents[0].len()),
                |mut acc, content| {
                    acc.push_str(content);
                    acc.push('\n');
                    acc
                },
            );

        let search_time = instant_now.elapsed().as_millis() - embedding_time - retrieval_time;

        Ok(EvaluatedMessage {
            perf: Perf {
                cached,
                token_count,
                retrieval_time: retrieval_time.to_string(),
                embedding_time: embedding_time.to_string(),
                search_time: search_time.to_string(),
                context: merged_similar_content.clone(),
                ..Default::default()
            },
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
            // .split_whitespace()
            // .collect::<Vec<&str>>()
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

pub fn top_similar_indexes(embeddings: Vec<Vec<f32>>, query: &[f32], kn: usize) -> Vec<usize> {
    // let instant = std::time::Instant::now();
    let hnsw = Hnsw::new(90, embeddings.len(), 16, 50, DistCosine);
    let embedding_w_index: Vec<(&Vec<f32>, usize)> = embeddings
        .iter()
        .enumerate()
        .map(|(i, embedding)| (embedding, i))
        .collect();
    hnsw.parallel_insert(&embedding_w_index);
    let neighbours = hnsw.search(query, kn, 60);
    // log::info!("hnsw search took {:?}", instant.elapsed());
    neighbours
        .into_iter()
        .map(|n| n.d_id)
        .collect::<Vec<usize>>()
}
