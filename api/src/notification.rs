use crate::{
    email_templates::*,
    types::{history_item::HistoryItem, user::User},
};
use eyre::Result;
use serde_json::json;

#[derive(Clone)]
pub struct Notification {
    context: Context,
}

#[derive(Clone)]
struct Context {
    email: String,
}

pub enum NotificationType {
    Admin(String),
    EmailForwarding(EmailForwarding),
    SourceError(String),
    KnowledgeGap(String),
    Token(String),
}

pub struct EmailForwarding {
    pub email: String,
    pub name: String,
    pub message: String,
    pub history: Vec<HistoryItem>,
}

impl Notification {
    pub fn new(email: String) -> Self {
        Self {
            context: Context { email },
        }
    }

    pub async fn send(&self, event_type: NotificationType) -> Result<()> {
        let client = reqwest::Client::new()
            .post("https://api.zeptomail.com/v1.1/email")
            .header("Authorization", dotenv!("ZEPTO_KEY"));

        let EmailData {
            from,
            html,
            subject,
            name,
        } = event_type.into();

        let json_body = json!({
            "from": {
                "address": from,
                "name": name.unwrap_or_else(|| "PageBot".to_string())
            },
            "to": [
                {
                    "email_address": {
                        "address": self.context.email,
                        "name": self.context.email
                    }
                }
            ],
            "subject": subject,
            "htmlbody": html
        });
        client.json(&json_body).send().await?;
        Ok(())
    }
}

struct EmailData {
    subject: String,
    html: String,
    from: String,
    name: Option<String>,
}

impl From<NotificationType> for EmailData {
    fn from(notification_type: NotificationType) -> Self {
        let from = "noreply@thepagebot.com".to_string();
        match notification_type {
            NotificationType::Admin(message) => Self {
                subject: "Admin Notification".to_string(),
                html: message,
                from,
                name: None,
            },
            NotificationType::EmailForwarding(email) => Self {
                subject: format!("Email Request from: {} - PageBot", email.name),
                html: render_forwarding(email.email, email.message, email.history),
                from,
                name: email.name.into(),
            },
            NotificationType::SourceError(url) => Self {
                subject: "Source Error - PageBot".to_string(),
                html: render_source_error(&url),
                from,
                name: None,
            },
            NotificationType::KnowledgeGap(query) => Self {
                subject: "Knowledge Gap Detected - PageBot".to_string(),
                html: render_knowledge_gap(&query),
                from,
                name: None,
            },
            NotificationType::Token(token) => Self {
                subject: format!("PageBot Login Verification Code: {}", token),
                html: format!(
                    "<h3>Verify your email to log on to PageBot</h3> <h1 style=\"letter-spacing: 2px;\">{}</h1><p>This code will expire in 10 minutes.</p>",
                    token
                ),
                from,
                name: None,
            },
        }
    }
}
