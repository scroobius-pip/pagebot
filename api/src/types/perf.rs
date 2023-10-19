#[derive(Debug, Clone, serde::Serialize, Default)]
pub struct Perf {
    pub retrieval_time: String,
    pub context: String,
    pub embedding_time: String,
    pub search_time: String,
    pub total_time: String,
    pub first_chunk_time: String,
    pub token_count: usize,
    pub cached: bool,
}
