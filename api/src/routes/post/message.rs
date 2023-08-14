use crate::types::{
    message::{EvaluatedMessage, Message},
    usage::UsageItem,
    user::User,
};
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestMessage, ChatCompletionResponseStream,
        ChatCompletionResponseStreamMessage, ChatCompletionStreamResponseDelta,
        CreateChatCompletionRequestArgs, CreateChatCompletionStreamResponse, Role,
    },
    Client,
};
use axum::{
    response::{sse::Event, Sse},
    Json,
};
use eyre::Result;
use futures::{Stream, StreamExt};
use reqwest::StatusCode;

pub async fn main(
    Json(message): Json<Message>,
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

    if !user.subscribed {
        return Err(StatusCode::FORBIDDEN);
    }

    let evaluated_message = &message.evaluate().await.map_err(|e| {
        log::error!("Failed to evaluate message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let usage_item: UsageItem = evaluated_message.into();

    tokio::spawn(async move { usage_item.submit().await.save() });

    let mut response_stream = get_response(evaluated_message.clone()).await.map_err(|e| {
        log::error!("Failed to get response: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let stream = async_stream::stream! {
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

                yield Ok(Event::default().data(content));
            }
        }

    };

    Ok(Sse::new(stream))
}

async fn get_response(message: EvaluatedMessage) -> Result<ChatCompletionResponseStream> {
    let max_tokens: u16 = 300;
    let model_name = if message.token_count < (4096 - max_tokens).into() {
        "gpt-3.5-turbo"
    } else {
        "gpt-3.5-turbo-16k"
    };
    let information = message.sources.join("\n");

    let prompted_message = format!(
        "page_url:{}\ninformation:{}\n{}\nuser: {}\nbot:",
        message.page_url, information, PROMPT_GUIDE, message.query
    );

    let chat_message = vec![ChatCompletionRequestMessage {
        content: prompted_message.into(),
        name: None,
        role: Role::User,
        function_call: None,
    }];
    let request = CreateChatCompletionRequestArgs::default()
        .model(model_name)
        .messages(chat_message)
        .max_tokens(max_tokens)
        .stream(true)
        .build()
        .expect("Failed to build request");

    let client = async_openai::Client::with_config(
        OpenAIConfig::default().with_api_key(dotenv!("OPENAI_API_KEY")),
    );

    let response_stream = client.chat().create_stream(request).await?;

    Ok(response_stream)
}

const PROMPT_GUIDE: &str = r#"You're a bot that is knowledgeable about information above, ready to answer questions about it in a succinct manner. Only reply to questions that have information about them above.
Write the information in markdown.
user: Hi!
bot:**Hey!**, _how can I help you today?_
"#;

lazy_static! {
    // pub static ref OPENAI_CLIENT: Client = Client::new().with_api_key(dotenv!("OPENAI_API_KEY"));
}
