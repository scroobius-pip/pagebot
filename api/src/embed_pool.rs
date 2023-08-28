use eyre::Result;
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModel, SentenceEmbeddingsModelType,
};
use std::sync::{Arc, Mutex};

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

    pub fn encode(&self, sentences: Vec<String>) -> Result<Vec<Embedding>> {
        let sentences = sentences.clone();
        let model = self.model.clone();

        let lock = model.lock();

        let result = lock
            .map_err(|e| eyre::eyre!("Failed to lock model: {:?}", e))?
            .encode(&sentences)?;
//vector size is 512
        Ok(result)
    }
}

lazy_static! {
    pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
}
