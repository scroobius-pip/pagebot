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
            Operation::Ask(message) => Response::Chunk(message),
            Operation::Answer(message) => Response::Chunk(message),
            Operation::Email => Response::Email(""),
            Operation::NotFound => Response::NotFound(""),
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
        if !allowed_domains.contains(&host) {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    if user.disabled {
        let user_email = user.email.clone();
        tokio::spawn(async move {
            _ = Notification::new(user_email)
                .send(NotificationType::FreeLimitReached)
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

    // let response_stream = get_response_stream(&evaluated_message, history)
    //     .await
    //     .map_err(|e| {
    //         log::error!("Failed to get response: {}", e);
    //         StatusCode::INTERNAL_SERVER_ERROR
    //     })?;

    // let mut response_stream = Box::into_pin(response_stream);

    let query = evaluated_message.query.clone();
    let gen_notification = notification.clone();
    let mut perf = evaluated_message.perf.clone();
    let response = get_response(evaluated_message.clone(), history);

    let stream = async_stream::stream! {
    let first_chunk_timer = std::time::Instant::now();
    match response.await {
        Ok(operation) => {

            let first_chunk_time = first_chunk_timer.elapsed().as_millis();
            perf.first_chunk_time = first_chunk_time.to_string();
            perf.total_time = total_time.elapsed().as_millis().to_string();
            let perf_response = Response::Perf(perf);

            yield Ok(Event::default().data(serde_json::to_string(&perf_response).expect("Failed to serialize perf")));

            let mut not_found = false;
            let response = match operation {
                Operation::Ask(message) => {
                    Response::Chunk(message)
                },
                Operation::Answer(message) => {
                    Response::Chunk(message)

                },
                Operation::Email => {
                    Response::Email("")
                },
                Operation::NotFound => {
                    not_found = true;
                    Response::NotFound("")
                }
            };

            yield Ok(Event::default().data(serde_json::to_string(&response).expect("Failed to serialize response")));

            if not_found {
                let q = query.clone();
                let notification = gen_notification.clone();
                tokio::spawn(async move {
                     _ = notification
                        .send(NotificationType::KnowledgeGap(q))
                        .await;
                 });
            }
        },
        Err(err) =>{
            log::error!("Failed to get response: {}", err);
            yield Ok(Event::default().data(serde_json::to_string(&Response::NotFound("Failed to get response")).unwrap()));
        }
    }
    // let mut send_elapsed = true;


    // while let Some(response) = response_stream.next().await {

    //     if send_elapsed {
    //         let first_chunk_time = first_chunk_timer.elapsed().as_millis();
    //         perf.first_chunk_time = first_chunk_time.to_string();
    //         perf.total_time = total_time.elapsed().as_millis().to_string();
    //         let response = Response::Perf(perf.clone());

    //         yield Ok(Event::default().data(serde_json::to_string(&response).unwrap()));
    //         send_elapsed = false;
    //     }

    //     match response {
    //         Ok(operation) => {
    //             let response: Response = operation.into();
    //             yield Ok(Event::default().data(serde_json::to_string(&response).unwrap()));

    //             if matches!(response, Response::NotFound(_)) {
    //                 let q = query.clone();
    //                 let notification = gen_notification.clone();

    //               tokio::spawn(async move {
    //                _ = notification
    //                 .send(NotificationType::KnowledgeGap(q))
    //                 .await;
    //              });

    //             }
    //         },
    //         Err(err) =>{
    //             log::error!("Failed to get response: {}", err);
    //             yield Ok(Event::default().data(serde_json::to_string(&Response::Error("Failed to get response")).unwrap()));
    //         }
    //     }
    // }

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
