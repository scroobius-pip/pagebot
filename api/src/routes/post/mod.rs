use crate::export_route;
use crate::routes::Route;
use axum::routing::post;

export_route!(
    post,
    message,
    stripe_webhook,
    ls_webhook,
    email,
    domains,
    login,
    jwt,
);
