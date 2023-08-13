use axum::{
    response::{IntoResponse, Response},
    Json,
};

use reqwest::StatusCode;

use serde_json::json;

#[derive(Debug)]
pub enum AuthError {
    WrongCredentials,
    MissingCredentials,
    TokenCreation,
    InvalidToken,
    StateError,
    NotSubscribed,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::WrongCredentials => (StatusCode::UNAUTHORIZED, "WRONG_CREDENTIALS"),
            AuthError::MissingCredentials => (StatusCode::BAD_REQUEST, "MISSING_CREDENTIALS"),
            AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "TOKEN_CREATION_ERROR"),
            AuthError::InvalidToken => (StatusCode::BAD_REQUEST, "INVALID_TOKEN"),
            AuthError::StateError => (StatusCode::INTERNAL_SERVER_ERROR, "STATE_ERROR"),
            AuthError::NotSubscribed => (StatusCode::UNAUTHORIZED, "NOT_SUBSCRIBED"),
        };
        let body = Json(json!({
            "error": error_message,
        }));
        (status, body).into_response()
    }
}
