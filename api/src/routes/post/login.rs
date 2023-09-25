use axum::Json;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{
    notification::{self, Notification, NotificationType},
    routes::GenericResponse,
    token_map::Token,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Request {
    email: String,
}

pub async fn main(Json(Request { email }): Json<Request>) -> GenericResponse<()> {
    Notification::new(email.clone())
        .send(NotificationType::Token(
            Token::new(email.clone()).save().get_token(),
        ))
        .await
        .map(|_| (StatusCode::OK, ()))
        .map_err(|e| {
            log::error!("Failed to send notification: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}
