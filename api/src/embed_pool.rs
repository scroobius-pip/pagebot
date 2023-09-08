use eyre::Result;
use parking_lot::Mutex;
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
};
use std::sync::{atomic::AtomicUsize, Arc};

pub struct EmbeddingModel {
    model: Arc<Mutex<SentenceEmbeddingsModel>>,
    // models: Vec<Arc<Mutex<SentenceEmbeddingsModel>>>,
}

pub type Embedding = Vec<f32>;

impl EmbeddingModel {
    fn new() -> Result<Self> {
        let model = SentenceEmbeddingsBuilder::remote(
            SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
        )
        .create_model()?;

        // let mut models = Vec::new();
        // for _ in 0..4 {
        //     let model = model()?;
        //     models.push(Arc::new(Mutex::new(model)));
        // }

        // Ok(Self { models })

        Ok(Self {
            model: Arc::new(Mutex::new(model)),
        })
    }

    pub fn encode(&self, sentences: &[String]) -> Result<Vec<Embedding>> {
        let sentences = sentences.clone();
        // let model = self.select_model();
        let model = self.model.clone();

        let lock = model.lock();

        let result = lock.encode(sentences)?;
        //vector size is 512
        Ok(result)
    }

    // pub fn select_model(&self) -> Arc<Mutex<SentenceEmbeddingsModel>> {
    //     let current_index = CURRENT_MODE_INDEX.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    //     self.models[current_index % 4].clone()
    // }
}

lazy_static! {
    pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
    pub static ref CURRENT_MODE_INDEX: AtomicUsize = AtomicUsize::new(0);
}

// use eyre::Result;
// use parking_lot::Mutex;
// use rust_bert::pipelines::sentence_embeddings::{
//     SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
// };
// use std::sync::{atomic::AtomicUsize, Arc};

// pub struct EmbeddingModel {
//     // model: Arc<Mutex<SentenceEmbeddingsModel>>,
//     models: Vec<Arc<Mutex<SentenceEmbeddingsModel>>>,
// }

// pub type Embedding = Vec<f32>;

// impl EmbeddingModel {
//     fn new() -> Result<Self> {
//         let model = || {
//             SentenceEmbeddingsBuilder::remote(
//                 SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
//             )
//             .create_model()
//         };

//         let mut models = Vec::new();
//         for _ in 0..4 {
//             let model = model()?;
//             models.push(Arc::new(Mutex::new(model)));
//         }

//         Ok(Self { models })

//         // Ok(Self {
//         //     model: Arc::new(Mutex::new(model)),
//         // })
//     }

//     pub fn encode(&self, sentences: &[String]) -> Result<Vec<Embedding>> {
//         let sentences = sentences.clone();
//         let model = self.select_model();

//         let lock = model.lock();

//         let result = lock.encode(sentences)?;
//         //vector size is 512
//         Ok(result)
//     }

//     pub fn select_model(&self) -> Arc<Mutex<SentenceEmbeddingsModel>> {
//         let current_index = CURRENT_MODE_INDEX.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
//         self.models[current_index % 4].clone()
//     }
// }

// lazy_static! {
//     pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
//     pub static ref CURRENT_MODE_INDEX: AtomicUsize = AtomicUsize::new(0);
// }
