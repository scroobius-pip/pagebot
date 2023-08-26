use super::{
    source::{Source, SourceInput},
    usage::{Usage, UsageItem},
};
use eyre::Result;
use futures::future::join_all;
use hnsw_rs::prelude::{DistCosine, Hnsw};
use instant_distance::{Builder, Search};
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
    pub sources: Vec<String>,
    pub retrieval_count: u16,
    pub token_count: usize,
    pub query: String,
    pub page_url: String,
    //response isn't a string, we're using a placeholder for an async iterator or something
    pub response: String,
}

impl Message {
    pub async fn evaluate(self) -> Result<EvaluatedMessage> {
        let pending_sources = self.sources.into_iter().map(Source::new);

        let ((contents, embeddings), retrieval_count, token_count) =
            join_all(pending_sources).await.into_iter().fold(
                ((vec![], vec![]), 0, 0),
                |((mut contents, mut embeddings), retrieval_count, token_count), source| {
                    if let Ok((mut source, retrieved)) = source {
                        let token_count = token_count + count_tokens(&source.content());

                        contents.append(&mut source.chunks.value.0);
                        embeddings.append(&mut source.chunks.value.1);

                        (
                            (contents, embeddings),
                            retrieval_count + retrieved as u16,
                            token_count,
                        )
                    } else {
                        ((contents, embeddings), retrieval_count, token_count)
                    }
                },
            );

        let mut token_count = token_count + count_tokens(&self.query);
        //5% error margin
        token_count = token_count + (token_count / 20);

        unimplemented!()
        // let sources: Vec<String> = sources.into_iter().map(|source| source.content).collect();

        // Ok(EvaluatedMessage {
        //     user_id: self.user_id,
        //     sources,
        //     retrieval_count,
        //     query: self.query,
        //     page_url: self.page_url.to_string(),
        //     response: String::new(),
        //     token_count,
        // })
    }
}

impl From<EvaluatedMessage> for UsageItem {
    fn from(message: EvaluatedMessage) -> Self {
        let source_word_count = message
            .sources
            .iter()
            .fold(0, |acc, source| acc + source.split_whitespace().count());

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
            .sources
            .iter()
            .fold(0, |acc, source| acc + source.split_whitespace().count());

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

pub fn top_similar_indexes(embeddings: Vec<Vec<f32>>, query: &Vec<f32>) -> Vec<usize> {
    let hnsw = Hnsw::new(100, embeddings.len(), 16, 50, DistCosine);
    // hnsw.parallel_insert(embeddings);
    let embedding_w_index: Vec<(&Vec<f32>, usize)> = embeddings
        .iter()
        .enumerate()
        .map(|(i, embedding)| (embedding, i))
        .collect();

    hnsw.parallel_insert(&embedding_w_index);
    let use eyre::Result;
    use rust_bert::pipelines::sentence_embeddings::{
        SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
    };
    use std::sync::{Arc, Mutex};
    
    pub struct EmbeddingModel {
        model: Arc<Mutex<SentenceEmbeddingsModel>>,
    }
    
    // pub type Embedding = Vec<f32>;
    #[derive(Debug, Clone)]
    pub struct Embedding {
        embedding: Vec<f32>,
    }
    
    impl Embedding {
        fn new(embedding: Vec<f32>) -> Self {
            Self { embedding }
        }
    }
    
    impl From<Vec<f32>> for Embedding {
        fn from(embedding: Vec<f32>) -> Self {
            Self::new(embedding)
        }
    }
    
    impl EmbeddingModel {
        fn new() -> Result<Self> {
            let model = SentenceEmbeddingsBuilder::remote(
                SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
            )
            .create_model()?;
            Ok(Self {
                model: Arc::new(Mutex::new(model)),
            })
        }
    
        pub fn encode(&self, sentences: Vec<String>) -> Result<Vec<Embedding>> {
            let sentences = sentences.clone();
            let model = self.model.clone();
    
            let lock = model.lock();
    
            let result = lock
                .map_err(|e| eyre::eyre!("Failed to lock model: {:?}", e))?
                .encode(&sentences)?
                .into_iter()
                .map(|embedding| embedding.into())
                .collect::<Vec<Embedding>>();
    
            Ok(result)
        }
    }
    
    lazy_static! {
        pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
    }
    use eyre::Result;
    use rust_bert::pipelines::sentence_embeddings::{
        SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
    };
    use std::sync::{Arc, Mutex};
    
    pub struct EmbeddingModel {
        model: Arc<Mutex<SentenceEmbeddingsModel>>,
    }
    
    // pub type Embedding = Vec<f32>;
    #[derive(Debug, Clone)]
    pub struct Embedding {
        embedding: Vec<f32>,
    }
    
    impl Embedding {
        fn new(embedding: Vec<f32>) -> Self {
            Self { embedding }
        }
    }
    
    impl From<Vec<f32>> for Embedding {
        fn from(embedding: Vec<f32>) -> Self {
            Self::new(embedding)
        }
    }
    
    impl EmbeddingModel {
        fn new() -> Result<Self> {
            let model = SentenceEmbeddingsBuilder::remote(
                SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
            )
            .create_model()?;
            Ok(Self {
                model: Arc::new(Mutex::new(model)),
            })
        }
    
        pub fn encode(&self, sentences: Vec<String>) -> Result<Vec<Embedding>> {
            let sentences = sentences.clone();
            let model = self.model.clone();
    
            let lock = model.lock();
    
            let result = lock
                .map_err(|e| eyre::eyre!("Failed to lock model: {:?}", e))?
                .encode(&sentences)?
                .into_iter()
                .map(|embedding| embedding.into())
                .collect::<Vec<Embedding>>();
    
            Ok(result)
        }
    }
    
    lazy_static! {
        pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
    }
     let     = hnsw.search(query, 50, 80);
    search
        .into_iter()
        .map(|neigh| index)
        .collect::<Vec<usize>>()
}
