use crate::{
    lemonsqueezy::{
        EventData, Subscription, SubscriptionAttributes, SubscriptionAttributesStatus,
        SubscriptionItem,
    },
    routes::GenericResponse,
    types::user::User,
};
use axum::Json;
use reqwest::StatusCode;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Event {}
pub async fn main(Json(event): Json<EventData>) -> GenericResponse<()> {
    let EventData {
        data:
            Subscription {
                attributes:
                    SubscriptionAttributes {
                        user_email,
                        status,
                        first_subscription_item:
                            SubscriptionItem {
                                id: subscription_id,
                            },
                        ..
                    },
            },
        ..
    } = event;

    if let Ok(Some(user)) = User::by_email(&user_email) {
        let is_active = matches!(status, SubscriptionAttributesStatus::Active);

        _ = User {
            subscribed: is_active,
            disabled: !is_active,
            ls_subscription_id: if is_active {
                Some(subscription_id)
            } else {
                None
            },
            current_limit: if is_active { 10_000 } else { 50 },
            ..user
        }
        .save();
    }

    Ok((StatusCode::OK, ()))
}
