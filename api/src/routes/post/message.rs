use std::sync::Arc;

use crate::{
    notification::{Notification, NotificationType},
    stats::MESSAGE_COUNT,
    types::{
        history_item::HistoryItem,
        message::{EvaluatedMessage, Message},
        perf::Perf,
        usage::{Usage, UsageItem},
        user::User,
    },
};
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestMessage, ChatCompletionResponseStream,
        ChatCompletionResponseStreamMessage, ChatCompletionStreamResponseDelta,
        CreateChatCompletionRequestArgs, CreateChatCompletionStreamResponse, Role,
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

impl From<&String> for Response {
    fn from(s: &String) -> Self {
        if s.contains("_N") {
            Response::NotFound("")
        } else if s.contains("_E") {
            Response::Email("")
        } else if s.is_empty() {
            Response::None("")
        } else {
            Response::Chunk(s.clone())
        }
    }
}

pub async fn main(
    Host(host): Host,
    Json(Request { message, history }): Json<Request>,
) -> Result<Sse<impl Stream<Item = Result<Event>>>, StatusCode> {
    let total_time = std::time::Instant::now();
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

    #[cfg(not(debug_assertions))]
    if !user.subscribed {
        return Err(StatusCode::FORBIDDEN);
    }

    let notification = Arc::new(Notification::new(user.email.clone()));

    let evaluated_message = message.evaluate(notification.clone()).await.map_err(|e| {
        log::error!("Failed to evaluate message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut response_stream = get_response(&evaluated_message, history)
        .await
        .map_err(|e| {
            log::error!("Failed to get response: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let query = evaluated_message.query.clone();
    let gen_notification = notification.clone();
    let mut perf = evaluated_message.perf.clone();
    let stream = async_stream::stream! {
        // // #[cfg(not(debug_assertions))]
        // {
        //     yield Ok(Event::default().data("EVALUATED"));
        //     return;
        // }
        let first_chunk_timer = std::time::Instant::now();

        let mut send_elapsed = true;
        while let Some(Ok(CreateChatCompletionStreamResponse { choices, .. })) =
            response_stream.next().await
        {
            if let Some(ChatCompletionResponseStreamMessage {
                delta:
                    ChatCompletionStreamResponseDelta {
                        content: Some(content),
                        ..
                    },
                ..
            }) = choices.first()
            {
                if send_elapsed {
                    let first_chunk_time = first_chunk_timer.elapsed().as_millis();

                    perf.first_chunk_time = first_chunk_time.to_string();
                    perf.total_time = total_time.elapsed().as_millis().to_string();

                    let response = Response::Perf(perf.clone());
                    yield Ok(Event::default().data(serde_json::to_string(&response).unwrap()));
                    send_elapsed = false;
                }

                let response: Response = content.into();
                yield Ok(Event::default().data(serde_json::to_string(&response).unwrap()));

                if matches!(response, Response::NotFound(_)) {
                    let notification_result = gen_notification
                        .clone()
                        .send(NotificationType::KnowledgeGap(query.clone()))
                        .await;
                    if let Err(e) = notification_result {
                        log::error!("Failed to send notification: {}", e);
                    }
                }
            }
        }

    };

    tokio::spawn(async move {
        MESSAGE_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        #[cfg(not(debug_assertions))]
        const FREE_MESSAGE_COUNT: u32 = 50;

        #[cfg(debug_assertions)]
        const FREE_MESSAGE_COUNT: u32 = 1;

        let usage_item = UsageItem::from(evaluated_message);
        let usage = Usage::by_id(usage_item.usage_id)
            .map(|usage| usage.unwrap_or_else(|| Usage::new(usage_item.usage_id)));

        match usage {
            Ok(usage) => {
                if !user.subscribed && usage.message_count == FREE_MESSAGE_COUNT + 10 {
                    _ = notification.send(NotificationType::LimitReached).await;
                    user.subscribed = false;
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
const MAX_HISTORY: usize = 4;
async fn get_response(
    message: &EvaluatedMessage,
    history: Vec<HistoryItem>,
) -> Result<ChatCompletionResponseStream> {
    let max_tokens: u16 = 300;
    let model_name = if message.token_count < (4096 - max_tokens).into() {
        "gpt-3.5-turbo"
    } else {
        "gpt-3.5-turbo-16k"
    };
    let information = &message.merged_sources;

    let prompted_message = format!(
        "page_url:{}\ninformation:{}\n{}\nuser: {}\nbot:",
        message.page_url, information, PROMPT_GUIDE, message.query
    );

    let chat_message = history[..history.len().min(MAX_HISTORY)]
        .iter()
        .map(|item| ChatCompletionRequestMessage {
            content: item.content.clone().into(),
            name: None,
            role: if item.bot {
                Role::Assistant
            } else {
                Role::User
            },
            function_call: None,
        })
        .chain(std::iter::once(ChatCompletionRequestMessage {
            content: prompted_message.into(),
            name: None,
            role: Role::User,
            function_call: None,
        }))
        .collect::<Vec<_>>();

    let request = CreateChatCompletionRequestArgs::default()
        .model(model_name)
        .messages(chat_message)
        .max_tokens(max_tokens)
        .stream(true)
        .build()
        .expect("Failed to build request");

    let response_stream = OPENAI_CLIENT.chat().create_stream(request).await?;

    Ok(response_stream)
}

const PROMPT_GUIDE: &str = r#"You're a bot that is knowledgeable about information above, ready to answer questions about it in a friendly manner. Only reply to questions that have information about them above.
If the question is not about the information above, reply with "_N"
If the question asks to speak or contact a human, reply with "_E"

Write the information in markdown.
user: Hi!
bot:**Hey!**, _how can I help you today?_

user: What is the capital of France?
bot: _N

user: What is <Information not available> ?
bot: _N

user: I'd like to speak to someone
bot: _E
"#;

lazy_static! {
    pub static ref OPENAI_CLIENT: async_openai::Client<OpenAIConfig> =
        async_openai::Client::with_config(
            OpenAIConfig::default().with_api_key(dotenv!("OPENAI_API_KEY")),
        );
}
