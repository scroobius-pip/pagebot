use crate::{
    notification::{self, NotificationType},
    types::user::User,
};
use axum::Json;
use eyre::Result;
use reqwest::StatusCode;
use serde::Deserialize;
use serde_aux::field_attributes::deserialize_number_from_string;

use super::message::HistoryItem;

#[derive(Deserialize, Clone)]
pub struct Request {
    email: String,
    name: String,
    message: String,
    #[serde(deserialize_with = "deserialize_number_from_string")]
    user_id: u64,
    history: Vec<HistoryItem>,
    page_url: String,
}
pub async fn main(
    Json(Request {
        email,
        name,
        message,
        user_id,
        history,
        page_url,
    }): Json<Request>,
) -> Result<StatusCode, StatusCode> {
    let user = User::by_id(user_id)
        .map_err(|e| {
            log::error!("Failed to get user: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            log::error!("User not found: {} ", user_id);
            StatusCode::NOT_FOUND
        })?;

    let notification = notification::Notification::new(user);
    notification
        .send(NotificationType::User(
            format!("Email request from: {}", name),
            format!(
                "Email: {}<br>Message: {}<br>Page: {}<br>History: {}",
                email,
                message,
                page_url,
                super::message::get_history(history)
            ),
        ))
        .await
        .map_err(|e| {
            log::error!("Failed to send notification: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::OK)
}
