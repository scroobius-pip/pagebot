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

    if let Ok(Some(mut user)) = User::by_email(&user_email) {
        user.subscribed = matches!(status, SubscriptionAttributesStatus::Active);
        user.ls_subscription_id = Some(subscription_id);
        user.current_limit = 10_000;
        _ = user.save();
    }

    Ok((StatusCode::OK, ()))
}
