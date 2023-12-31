use eyre::Result;
use serde::{Deserialize, Serialize};
use serde_email::Email;

use crate::db::DB;

use super::usage::{Usage, UsageOutput};

pub const FREE_MESSAGE_COUNT: u32 = 50;

#[derive(Debug, Deserialize, Serialize, Clone, Default)]
pub struct User {
    pub created_at: u32,
    pub id: u64,
    pub email: String,
    pub subscribed: bool,
    pub disabled: bool,
    pub current_limit: u32,
    pub ls_subscription_id: Option<u64>,
    pub allowed_domains: Option<Vec<String>>,
}

pub struct UserInput {
    pub email: Email,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UserOutput {
    pub email: String,
    pub id: String,
    pub subscribed: bool,
    // pub usage: Vec<Usage>,
    pub usage: UsageOutput,
    pub subscription_id: Option<u64>,
    pub allowed_domains: Option<Vec<String>>,
}

impl UserInput {
    pub fn new(email: &str) -> Result<Self> {
        let email = Email::new(email.to_owned())?;
        Ok(Self { email })
    }
}

impl User {
    fn id(email: &str) -> u64 {
        let hash_builder: ahash::RandomState = ahash::RandomState::with_seeds(20, 3, 1, 222);
        hash_builder.hash_one(email)
    }

    pub fn by_id(id: u64) -> Result<Option<User>> {
        let user = DB.user(id)?;
        Ok(user)
    }

    pub fn by_email(email: &str) -> Result<Option<User>> {
        let user: Option<User> = DB.user(User::id(email))?;
        Ok(user)
    }

    pub fn save(&self) -> Result<Self> {
        let user = DB.user_save(self.clone())?;

        Ok(user)
    }
}

impl From<UserInput> for User {
    fn from(input: UserInput) -> Self {
        Self {
            created_at: chrono::Utc::now().timestamp() as u32,
            id: Self::id(input.email.as_ref()),
            email: input.email.to_string(),
            subscribed: false,
            disabled: false,
            current_limit: FREE_MESSAGE_COUNT,
            ls_subscription_id: None,
            allowed_domains: None,
        }
    }
}

impl From<User> for UserOutput {
    fn from(user: User) -> Self {
        let usage = Usage::by_id(Usage::current_id(user.id))
            .unwrap_or_default()
            .unwrap_or_default()
            .into();

        Self {
            id: user.id.to_string(),
            email: user.email,
            subscribed: user.subscribed,
            subscription_id: user.ls_subscription_id,
            usage,
            allowed_domains: user.allowed_domains,
        }
    }
}
