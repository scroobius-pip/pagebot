use crate::export_route;
use crate::routes::Route;
use axum::routing::get;

export_route!(get, me, (checkout_session, "checkout_session"));
