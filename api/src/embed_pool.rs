use eyre::Result;
use parking_lot::Mutex;
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
};
use std::sync::Arc;

pub struct EmbeddingModel {
    model: Arc<Mutex<SentenceEmbeddingsModel>>,
}

pub type Embedding = Vec<f32>;

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

    pub fn encode(&self, sentences: &[String]) -> Result<Vec<Embedding>> {
        let sentences = sentences.clone();
        let model = self.model.clone();

        let lock = model.lock();

        let result = lock.encode(sentences)?;
        //vector size is 512
        Ok(result)
    }
}

lazy_static! {
    pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
}

// use std::{
//     f32::consts::LOG10_2,
//     sync::{atomic::AtomicUsize, Arc},
// };

// use eyre::Result;
// use parking_lot::Mutex;
// use rust_bert::pipelines::sentence_embeddings::{
//     SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
// };

// pub struct EmbeddingModel {
//     models: Vec<Arc<Mutex<SentenceEmbeddingsModel>>>,
//     pool: rayon::ThreadPool, // model: Arc<Mutex<SentenceEmbeddingsModel>>,
// }

// const MODEL_COUNT: usize = 4;

// pub type Embedding = Vec<f32>;

// impl EmbeddingModel {
//     fn new() -> Result<Self> {
//         log::info!("Loading models");
//         let mut models = Vec::new();
//         let instant = std::time::Instant::now();
//         for _ in 0..MODEL_COUNT {
//             let model = SentenceEmbeddingsBuilder::remote(
//                 SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
//             )
//             .create_model()?;
//             models.push(Arc::new(Mutex::new(model)));
//         }
//         log::info!("Loaded models in {}ms", instant.elapsed().as_secs());
//         Ok(Self {
//             models,
//             pool: rayon::ThreadPoolBuilder::new()
//                 .num_threads(MODEL_COUNT)
//                 .build()?,
//         })
//     }

//     pub async fn encode(&self, sentences: Vec<String>) -> Result<Vec<Embedding>> {
//         log::info!("Encoding sentences");
//         let (send, recv) = tokio::sync::oneshot::channel();
//         let model = self.models[Self::model_index()].clone();
//         let instant_now = std::time::Instant::now();

//         self.pool.spawn_fifo(move || {
//             let lock = model.lock(); //critical section
//             let embeddings = lock.encode(&sentences);
//             send.send(embeddings)
//                 .is_err()
//                 .then(|| log::error!("Failed to send embeddings"));
//         });

//         let result = recv
//             .await
//             .map_err(|_| eyre::eyre!("Failed to receive embeddings"))?
//             .map_err(|e| eyre::eyre!("Failed to encode sentences: {}", e));

//         log::info!("Embedding took: {}ms", instant_now.elapsed().as_millis());
//         result
//     }

//     fn model_index() -> usize {
//         let current_index = CURRENT_MODE_INDEX.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
//         current_index % MODEL_COUNT
//     }
// }

// lazy_static! {
//     // pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
//     // pub static ref CURRENT_MODE_INDEX: AtomicUsize = AtomicUsize::new(0);
// }

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
//     async fn benchmarks() {
//         //warmupz

//         let _ = tokio::task::spawn(async {
//             let sentences = vec!["I enjoy taking long walks".to_string()];
//             // let embeddings = EMBED_POOL.encode(sentences).await;
//             let embed_pool = EmbeddingModel::new().unwrap();
//             let embeddings = embed_pool.encode(sentences).await;
//             assert!(embeddings.is_ok());
//         })
//         .await;
//     }
// }
