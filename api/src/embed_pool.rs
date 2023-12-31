use std::env;

use eyre::Result;
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModelType,
};

pub struct EmbeddingModel {
    queue_recv: crossbeam::channel::Receiver<EmbedTask>,
    queue_send: crossbeam::channel::Sender<EmbedTask>,
}

pub type Embedding = Vec<f32>;
pub struct EmbedTask(
    tokio::sync::oneshot::Sender<Result<Vec<Embedding>>>,
    Vec<String>,
);

use std::sync::Once;

static INIT: Once = Once::new();

impl EmbeddingModel {
    fn new() -> Self {
        let (queue_send, queue_recv) = crossbeam::channel::bounded::<EmbedTask>(5000);
        Self {
            queue_recv,
            queue_send,
        }
    }

    pub fn run(&self) {
        INIT.call_once(|| {
            #[cfg(not(debug_assertions))]
            let thread_count = env::args()
                .nth(1)
                .and_then(|s| s.parse::<usize>().ok())
                .unwrap_or(4);

            #[cfg(debug_assertions)]
            let thread_count = 1;

            #[cfg(debug_assertions)]
            println!("EmbedPool Started");

            log::info!("Model Thread Count {}", thread_count);
            let task_worker = |_worker_index: usize| {
                #[cfg(debug_assertions)]
                println!("Worker {} initializing", _worker_index);

                let model =
                    SentenceEmbeddingsBuilder::remote(SentenceEmbeddingsModelType::AllMiniLmL6V2)
                        .create_model()
                        .expect("Failed to create model");

                #[cfg(debug_assertions)]
                println!("Worker {} initialized", _worker_index);
                loop {
                    while let Ok(EmbedTask(sender, sentences)) = self.queue_recv.recv() {
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
        });
    }

    pub async fn encode(&self, sentences: Vec<String>) -> Result<Vec<Embedding>> {
        let (sender, receiver) = tokio::sync::oneshot::channel::<Result<Vec<Embedding>>>();
        let task = EmbedTask(sender, sentences);
        self.queue_send.send(task)?;
        receiver.await?
    }
}

lazy_static! {
    pub static ref EMBED_POOL: EmbeddingModel = EmbeddingModel::new();
}
