use eyre::Result;

#[macro_use]
extern crate lazy_static;

#[macro_use]
extern crate dotenv_codegen;
extern crate dotenv;
extern crate unicode_segmentation;

mod auth;
mod db;
mod embed_pool;
mod jwt;
mod routes;
mod stats;
mod types;
use routes::build_router;

use env_logger::Env;
use stripe::{CheckoutSession, Client, CreateCheckoutSession};
use tokio::signal;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<()> {
    setup_logs();

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers(Any);

    let service = ServiceBuilder::new().layer(cors);

    let server_handler = tokio::spawn(async move {
        let app = build_router().layer(service);
        axum::Server::bind(&format!("0.0.0.0:{}", dotenv!("PORT")).parse().unwrap())
            .serve(app.into_make_service())
            // .with_graceful_shutdown(shutdown_signal())
            .await
            .unwrap();
    });

    //add new thread for stripe usage tracking

    let _ = server_handler.await;

    Ok(())
}

fn setup_logs() {
    std::env::set_var("RUST_BACKTRACE", "1");
    color_eyre::install().expect("Failed to install color_eyre");
    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();
}

lazy_static! {
    pub static ref STRIPE_CLIENT: Client = Client::new(dotenv!("STRIPE_SECRET_KEY"))
        .with_strategy(stripe::RequestStrategy::ExponentialBackoff(5));
}
