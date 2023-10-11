use std::sync::atomic::AtomicU32;

use embed_pool::EMBED_POOL;
use eyre::Result;

#[macro_use]
extern crate lazy_static;

#[macro_use]
extern crate dotenv_codegen;
extern crate dotenv;
extern crate unicode_segmentation;

mod auth;
mod db;
mod email_templates;
mod embed_pool;
mod jwt;
mod lemonsqueezy;
mod notification;
mod routes;
mod stats;
mod token_map;
mod types;


use routes::build_router;

use env_logger::Env;
use stats::{read_stats, write_stats};
// use stripe::Client;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<()> {
    setup_logs();
    read_stats();

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers(Any);

    let service = ServiceBuilder::new().layer(cors);

    let server_handler = tokio::spawn(async move {
        let app = build_router().layer(service);
        axum::Server::bind(&format!("0.0.0.0:{}", dotenv!("PORT")).parse().unwrap())
            .serve(app.into_make_service())
            .with_graceful_shutdown(async {
                shutdown_signal().await;
                write_stats();
            })
            .await
            .unwrap();
    });

    EMBED_POOL.run();

    let _ = server_handler.await;

    Ok(())
}

async fn shutdown_signal() {
    let mut sigint = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::interrupt())
        .expect("Failed to register SIGINT handler");

    let mut sigterm = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        .expect("Failed to register SIGTERM handler");

    tokio::select! {
        _ = sigint.recv() => {
            log::info!("Received SIGINT");
        }
        _ = sigterm.recv() => {
            log::info!("Received SIGTERM");
        }
    }
}

fn setup_logs() {
    std::env::set_var("RUST_BACKTRACE", "1");
    color_eyre::install().expect("Failed to install color_eyre");
    env_logger::Builder::from_env(Env::default().default_filter_or("error")).init();
}

lazy_static! {
    // pub static ref STRIPE_CLIENT: Client = Client::new(dotenv!("STRIPE_SECRET_KEY"))
    //     .with_strategy(stripe::RequestStrategy::ExponentialBackoff(5));
    // pub static ref LS_CLIENT: LemonSqueezy =
    //     LemonSqueezy::new(dotenv!("LS_SECRET_KEY").to_string());
}
