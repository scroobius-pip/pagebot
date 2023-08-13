use eyre::Result;
use serde::{Deserialize, Serialize};
use serde_email::Email;

use crate::db::DB;

use super::usage::Usage;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct User {
    pub created_at: u32,
    pub id: u64,
    pub email: String,
    pub subscribed: bool,
}

pub struct UserInput {
    pub email: Email,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UserOutput {
    pub email: String,
    pub id: String,
    pub subscribed: bool,
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
            subscribed: true,
        }
    }
}

impl From<User> for UserOutput {
    fn from(user: User) -> Self {
        Self {
            id: user.id.to_string(),
            email: user.email,
            subscribed: user.subscribed,
        }
    }
}
