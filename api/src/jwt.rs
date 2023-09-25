use crate::{
    auth::AuthError,
    stats::USER_COUNT,
    types::user::{User, UserInput},
};
use async_trait::async_trait;
use axum::{
    extract::{FromRequestParts, Query, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::request::Parts,
    RequestPartsExt,
};
use jsonwebtoken::{decode, encode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    // sub: String,
    iat: usize,
    pub email: String,
    exp: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AuthParams {
    auth_token: String,
}
pub struct UserContext {
    pub user: User,
}

#[async_trait]
impl<S> FromRequestParts<S> for UserContext
where
    S: Send + Sync,
{
    type Rejection = AuthError;
    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let secret: &str = dotenv!("JWT_SECRET");

        let bearer = match parts.extract::<TypedHeader<Authorization<Bearer>>>().await {
            Ok(TypedHeader(Authorization(bearer))) => Ok(bearer),
            Err(_) => {
                let Query(AuthParams { auth_token }) = parts
                    .extract::<Query<AuthParams>>()
                    .await
                    .map_err(|_| AuthError::InvalidToken)?;
                let Authorization(bearer) =
                    Authorization::bearer(&auth_token).map_err(|_| AuthError::InvalidToken)?;
                Ok(bearer)
            }
        }?;

        let token_data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::default(),
        )
        .map_err(|e| {
            log::error!("Error decoding token: {:?}", e);
            AuthError::InvalidToken
        })?;

        // check if user exists, if not create it
        let user = User::by_email(&token_data.claims.email).map_err(|e| {
            log::error!("Error getting user: {:?}", e);
            AuthError::StateError
        })?;

        let user = match user {
            Some(user) => user,
            None => {
                USER_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                let user_input =
                    UserInput::new(&token_data.claims.email).map_err(|_| AuthError::StateError)?;

                let user: User = user_input.into();
                user.save().map_err(|_| AuthError::StateError)?
            }
        };

        Ok(UserContext { user })
    }
}

impl Claims {
    pub fn new(email: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize;
        let day = 60 * 60 * 24;

        Self {
            email,
            iat: now,
            exp: now + day,
        }
    }

    pub fn generate_token(&self) -> Result<String, AuthError> {
        let secret: &str = dotenv!("JWT_SECRET");

        encode(
            &jsonwebtoken::Header::default(),
            &self,
            &jsonwebtoken::EncodingKey::from_secret(secret.as_ref()),
        )
        .map_err(|e| {
            log::error!("Error encoding token: {:?}", e);
            AuthError::StateError
        })
    }
}
