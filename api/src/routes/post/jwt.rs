use axum::Json;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{jwt::Claims, routes::JsonResponse, token_map::Token};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Request {
    email: String,
    token: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Response {
    jwt: String,
}

pub async fn main(Json(Request { email, token }): Json<Request>) -> JsonResponse<Response> {
    if Token::from_token(email.clone(), token).valid() {
        let jwt = Claims::new(email).generate_token().map_err(|_| {
            log::error!("Failed to generate token");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

        Ok((StatusCode::OK, Json(Response { jwt })))
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
