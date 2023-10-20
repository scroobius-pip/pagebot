use std::sync::Arc;

use crate::llm_retrieval::{get_response, get_response_stream, Operation};
use crate::types::user::FREE_MESSAGE_COUNT;
use crate::{
    notification::{Notification, NotificationType},
    stats::MESSAGE_COUNT,
    types::{
        history_item::HistoryItem,
        message::Message,
        perf::Perf,
        usage::{Usage, UsageItem},
        user::User,
    },
};

use axum::{
    extract::Host,
    response::{sse::Event, Sse},
    Json,
};
use eyre::Result;
use futures::{Stream, StreamExt};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Deserialize)]
pub struct Request {
    message: Message,
    history: Vec<HistoryItem>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Response {
    Chunk(String),
    Perf(Perf), //ms
    // we want serde to serialize the below as an key value valid json string.
    NotFound(&'static str),
    Email(&'static str),
    Error(&'static str),
    None(&'static str),
}

impl From<Operation> for Response {
    fn from(operation: Operation) -> Self {
        match operation {
            Operation::Ask((message, _)) => Response::Chunk(message),
            Operation::Answer((message, _)) => Response::Chunk(message),
            Operation::Email(_) => Response::Email(""),
            Operation::NotFound(_) => Response::NotFound(""),
        }
    }
}

impl From<&String> for Response {
    fn from(s: &String) -> Self {
        if s.contains("_N") {
            Response::NotFound("")
        } else if s.contains("_E") {
            Response::Email("")
        } else {
            Response::Chunk(s.clone())
        }
    }
}

pub async fn main(
    Host(host): Host,
    Json(Request { message, history }): Json<Request>,
) -> Result<Sse<impl Stream<Item = Result<Event>>>, StatusCode> {
    let mut user = User::by_id(message.user_id)
        .map_err(|e| {
            log::error!("Failed to get user: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            log::error!("User not found: {} ", message.user_id);
            StatusCode::NOT_FOUND
        })?;

    if let Some(allowed_domains) = &user.allowed_domains {
        if !allowed_domains.iter().any(|domain| host.contains(domain)) {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    if user.disabled {
        let user_email = user.email.clone();
        tokio::spawn(async move {
            _ = Notification::new(user_email)
                .send(NotificationType::MaxLimitReached)
                .await;
        });
        return Err(StatusCode::FORBIDDEN);
    }

    let notification = Arc::new(Notification::new(user.email.clone()));
    let total_time = std::time::Instant::now();

    let evaluated_message = message.evaluate(notification.clone()).await.map_err(|e| {
        log::error!("Failed to evaluate message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    log::info!("Evaluated message: {:?}", evaluated_message);

    let query = evaluated_message.query.clone();
    let gen_notification = notification.clone();
    let perf = evaluated_message.perf.clone();
    let response_stream = get_response_stream(&evaluated_message, history)
        .await
        .map_err(|e| {
            log::error!("Failed to get response stream: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut response_stream = Box::into_pin(response_stream);

    let stream = async_stream::stream! {
        let first_chunk_timer = std::time::Instant::now();
        let mut perf_sent = false;
        let mut not_found = false;

        while let Some(Ok(response)) = response_stream.next().await {
            if !perf_sent {
                perf_sent = true;
                let perf_response = Response::Perf(Perf {
                    first_chunk_time: first_chunk_timer.elapsed().as_millis().to_string(),
                    total_time: total_time.elapsed().as_millis().to_string(),
                    ..perf.clone()
                });
                yield Ok(Event::default().data(serde_json::to_string(&perf_response).expect("Failed to serialize perf")));
            }

            match  response {
                Operation::Ask((message, _)) => {
                    yield Ok(Event::default().data(serde_json::to_string(&Response::Chunk(message)).expect("Failed to serialize chunk")));
                }
                Operation::Answer((message, _)) => {
                    yield Ok(Event::default().data(serde_json::to_string(&Response::Chunk(message)).expect("Failed to serialize chunk")));
                }
                Operation::Email(_) => {
                    yield Ok(Event::default().data(serde_json::to_string(&Response::Email("")).expect("Failed to serialize email")));
                    break;
                }
                Operation::NotFound(_) => {
                    not_found = true;
                    yield Ok(Event::default().data(serde_json::to_string(&Response::NotFound("")).expect("Failed to serialize not found")));
                    break;
                }
            }
        }

        if not_found {
            let q = query.clone();
            let notification = gen_notification.clone();
            tokio::spawn(async move {
                 _ = notification
                    .send(NotificationType::KnowledgeGap(q))
                    .await;
             });
        }

    };

    tokio::spawn(async move {
        MESSAGE_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        let usage_item = UsageItem::from(evaluated_message);
        let usage = Usage::by_id(usage_item.usage_id)
            .map(|usage| usage.unwrap_or_else(|| Usage::new(usage_item.usage_id)));

        match usage {
            Ok(usage) => {
                if usage.message_count >= user.current_limit {
                    if user.subscribed {
                        _ = notification.send(NotificationType::MaxLimitReached).await;
                    } else {
                        _ = notification.send(NotificationType::FreeLimitReached).await;
                    }

                    user.disabled = true;
                    _ = user
                        .save()
                        .map_err(|e| log::error!("Failed to save user: {}", e));
                }

                if usage.message_count <= FREE_MESSAGE_COUNT {
                    _ = usage_item
                        .save(usage)
                        .map_err(|e| log::error!("Failed to save usage item: {}", e));
                } else {
                    _ = usage_item
                        .submit()
                        .await
                        .save(usage)
                        .map_err(|e| log::error!("Failed to save usage item: {}", e));
                }
            }
            Err(e) => {
                log::error!("Failed to get usage: {}", e);
            }
        }
    });

    Ok(Sse::new(stream))
}
