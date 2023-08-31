use std::sync::Arc;

use crate::{
    notification::{Notification, NotificationType},
    types::{
        message::{EvaluatedMessage, Message},
        usage::UsageItem,
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
    response::{sse::Event, Sse},
    Json,
};
use eyre::Result;
use futures::{Stream, StreamExt};
use reqwest::StatusCode;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Request {
    message: Message,
    history: Vec<HistoryItem>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HistoryItem {
    pub bot: bool,
    pub content: String,
}

pub async fn main(
    Json(Request { message, history }): Json<Request>,
) -> Result<Sse<impl Stream<Item = Result<Event>>>, StatusCode> {
    let user = User::by_id(message.user_id)
        .map_err(|e| {
            log::error!("Failed to get user: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            log::error!("User not found: {} ", message.user_id);
            StatusCode::NOT_FOUND
        })?;

    #[cfg(not(debug_assertions))]
    if !user.subscribed {
        return Err(StatusCode::FORBIDDEN);
    }

    let notification = Arc::new(Notification::new(user));

    let instant_now = std::time::Instant::now();

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
    let stream = async_stream::stream! {

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
                    let ms_elapsed = format!("MS_{:.2}", instant_now.elapsed().as_millis());
                    yield Ok(Event::default().data(ms_elapsed));
                    send_elapsed = false;
                }

                if content.contains("NOT_FOUND") {
                    let notification_result = notification
                        .send(NotificationType::User(format!(
                            "No answer found for the query: {} \n update your sources to account for this knowledge gap.",
                            query
                        )))
                        .await;
                    if let Err(e) = notification_result {
                        log::error!("Failed to send notification: {}", e);
                    }
                    yield Ok(Event::default().data("NOT_FOUND"));
                    break;
                }

                yield Ok(Event::default().data(content));
            }
        }

    };

    tokio::spawn(async move { UsageItem::from(evaluated_message).submit().await.save() });

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
If the question is not about the information above, reply with "NOT_FOUND"
If the question asks to speak or contact a human, reply with "EMAIL"

Write the information in markdown.
user: Hi!
bot:**Hey!**, _how can I help you today?_

user: What is the capital of France?
bot: NOT_FOUND

user: What is <Information not available> ?
bot: NOT_FOUND

user: I'd like to speak to someone
bot: EMAIL
"#;

lazy_static! {
    pub static ref OPENAI_CLIENT: async_openai::Client<OpenAIConfig> =
        async_openai::Client::with_config(
            OpenAIConfig::default().with_api_key(dotenv!("OPENAI_API_KEY")),
        );
}
