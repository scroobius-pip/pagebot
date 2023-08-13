use crate::merge_routes;
use axum::{http::StatusCode, routing::MethodRouter, Json, Router};
use color_eyre::eyre::Result;

pub mod get;
mod macros;
pub mod post;

pub struct Route<'a>(&'a str, MethodRouter);
pub(crate) type GenericResponse<T> = Result<(StatusCode, T), StatusCode>;
pub(crate) type JsonResponse<T> = GenericResponse<Json<T>>;

pub fn build_router() -> Router {
    let routes = merge_routes!(get::main(), post::main());
    routes.into_iter().fold(Router::new(), |router, route| {
        log::info!("Route: {}", route.0);
        router.route(route.0, route.1)
    })
}
