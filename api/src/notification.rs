use crate::types::{message::Message, user::User};
use eyre::Result;

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

    pub fn send(&self, event_type: NotificationType) -> Result<()> {
        match event_type {
            NotificationType::Admin(message) => {
                log::info!("Sending admin notification: {}", message);
            }
            NotificationType::User(message) => {
                log::info!(
                    "Sending user notification: {} to {} ",
                    message,
                    self.context.user.email
                );
            }
        }
        Ok(())
    }
}
