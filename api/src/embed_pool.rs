use std::env;

use eyre::Result;
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModelType,
};

pub struct EmbeddingModel {
    queue: (
        crossbeam::channel::Sender<EmbedTask>,
        crossbeam::channel::Receiver<EmbedTask>,
    ),
}

pub type Embedding = Vec<f32>;
pub struct EmbedTask(
    tokio::sync::oneshot::Sender<Result<Vec<Embedding>>>,
    Vec<String>,
);

impl EmbeddingModel {
    fn new() -> Result<Self> {
        let unbounded_channel = crossbeam::channel::unbounded::<EmbedTask>();
        let model = Self {
            queue: unbounded_channel,
        };

        Ok(model)
    }

    pub fn run(&self) {
        let thread_count = env::args()
            .nth(1)
            .and_then(|s| s.parse::<usize>().ok())
            .unwrap_or(4);

        log::info!("Model Thread Count {}", thread_count);
        let task_worker = |worker_index: usize| {
            let model = SentenceEmbeddingsBuilder::remote(
                SentenceEmbeddingsModelType::DistiluseBaseMultilingualCased,
            )
            .create_model()
            .expect("Failed to create model");

            loop {
                while let Ok(task) = self.queue.1.recv() {
                    log::info!("Worker {} received task", worker_index);
                    let EmbedTask(sender, sentences) = task;
                    let result = model.encode(&sentences).map_err(|e| e.into());
                    sender.send(result).unwrap();
                }
            }
        };

        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(thread_count)
            .build()
            .unwrap();

        pool.scope(|s| {
            for i in 0..thread_count {
                s.spawn(move |_| task_worker(i));
            }
        });
    }

    pub async fn encode(&self, sentences: &[String]) -> Result<Vec<Embedding>> {
        let (sender, receiver) = tokio::sync::oneshot::channel::<Result<Vec<Embedding>>>();
        let task = EmbedTask(sender, sentences.to_vec());
        self.queue.0.send(task)?;
        receiver.await?
    }
}

lazy_static! {
    pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new().unwrap();
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
