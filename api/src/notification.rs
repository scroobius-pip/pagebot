use crate::types::{message::Message, user::User};
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
    User(String),
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
                let html = format!("<p><strong>{}</strong></p>", message);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": "sim04ful@gmail.com",
                    "subject": "Admin Notification",
                    "html": html
                });
                client.json(&data).send().await?;
            }
            NotificationType::User(message) => {
                let html = format!("<p><strong>{}</strong></p>", message);
                let data = json!({
                    "from": "notification@notifications.thepagebot.com",
                    "to": self.context.user.email,
                    "subject": "PageBot Alert",
                    "html": html
                });
                client.json(&data).send().await?;
            }
        }
        Ok(())
    }
}
