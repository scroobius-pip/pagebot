use crate::export_route;
use crate::routes::Route;
use axum::routing::get;

export_route!(
    get,
    me,
    stats,
    (checkout_session, "checkout_session"),
    (benchmark, "loaderio-f6e0730790630a9271de186889ff3c19/")
);
