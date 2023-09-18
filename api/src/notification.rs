use crate::{
    email_templates::*,
    types::{history_item::HistoryItem, message::Message, user::User},
};
use eyre::Result;
use serde_json::json;

#[derive(Clone)]
pub struct Notification {
    context: Context,
}

#[derive(Clone)]
struct Context {
    user: User,
}

pub enum NotificationType {
    Admin(String),
    EmailForwarding(EmailForwarding),
    SourceError(String),
    KnowledgeGap(String),
}

pub struct EmailForwarding {
    pub email: String,
    pub name: String,
    pub message: String,
    pub history: Vec<HistoryItem>,
}

impl Notification {
    pub fn new(user: User) -> Self {
        Self {
            context: Context { user },
        }
    }

    pub async fn send(&self, event_type: NotificationType) -> Result<()> {
        let client = reqwest::Client::new()
            .post("https://api.resend.com/emails")
            .bearer_auth("re_LAD7vC9W_4y2arShe7t93T6KYvatbS885");

        match event_type {
            NotificationType::Admin(message) => {
                // let html = format!("<p><strong>{}</strong></p>", message);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": "sim04ful@gmail.com",
                    "subject": "Admin Notification",
                    "html": message
                });
                client.json(&data).send().await?;
            }

            NotificationType::EmailForwarding(email) => {
                let html = render_forwarding(email.email, email.message, email.history);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": self.context.user.email,
                    "subject":  format!("Email Request from: {} - Page Bot", email.name),
                    "html": html
                });
                client.json(&data).send().await?;
            }

            NotificationType::SourceError(url) => {
                let html = render_source_error(&url);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": self.context.user.email,
                    "subject": "Source Error - Page Bot",
                    "html": html
                });
                client.json(&data).send().await?;
            }

            NotificationType::KnowledgeGap(query) => {
                let html = render_knowledge_gap(&query);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": self.context.user.email,
                    "subject": "Knowledge Gap Detected - Page Bot",
                    "html": html
                });
                client.json(&data).send().await?;
            }
        }
        Ok(())
    }
}
