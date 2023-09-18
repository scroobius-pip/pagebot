use crate::{routes::JsonResponse, stats::*};
use axum::Json;
use reqwest::StatusCode;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Stats {
    pub user_count: u32,
    pub message_count: u64,
    pub page_count: u64,
}

pub async fn main() -> JsonResponse<Stats> {
    Ok((
        StatusCode::OK,
        Json(Stats {
            user_count: USER_COUNT.load(std::sync::atomic::Ordering::Relaxed),
            message_count: MESSAGE_COUNT.load(std::sync::atomic::Ordering::Relaxed),
            page_count: PAGE_COUNT.load(std::sync::atomic::Ordering::Relaxed),
        }),
    ))
}
