use crate::{jwt::UserContext, routes::JsonResponse, types::user::UserOutput};
use axum::Json;
use reqwest::StatusCode;

#[axum::debug_handler]
pub async fn main(UserContext { user }: UserContext) -> JsonResponse<UserOutput> {
    Ok((StatusCode::OK, Json(user.into())))
}
