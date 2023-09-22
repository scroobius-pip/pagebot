use axum::Json;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{jwt::UserContext, routes::JsonResponse};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Request {
    domains: Vec<String>,
}

pub async fn main(
    UserContext { mut user }: UserContext,
    Json(Request { domains }): Json<Request>,
) -> JsonResponse<Request> {
    user.allowed_domains = if domains.is_empty() {
        None
    } else {
        Some(domains)
    };
    
    _ = user.save().map_err(|e| {
        log::error!("Failed to save user: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok((
        StatusCode::OK,
        Json(Request {
            domains: user.allowed_domains.unwrap_or_default(),
        }),
    ))
}
