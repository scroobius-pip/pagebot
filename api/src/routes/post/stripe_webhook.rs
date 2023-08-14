use crate::types::user::User;
use axum::Json;
use reqwest::StatusCode;
use stripe::{Event, EventObject, EventType, NotificationEventRequest, Object};

use crate::routes::GenericResponse;

// #[axum::debug_handler]
pub async fn main(Json(event): Json<Event>) -> GenericResponse<()> {
    match (event.type_, event.data.object) {
        (EventType::CustomerSubscriptionCreated, EventObject::Subscription(subscription)) => {
            let email = subscription
                .customer
                .as_object()
                .ok_or_else(|| {
                    log::error!("CustomerSubscriptionCreated event has no customer object");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?
                .email
                .as_deref()
                .ok_or_else(|| {
                    log::error!("CustomerSubscriptionCreated event has no customer email");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

            if let Ok(Some(mut user)) = User::by_email(email) {
                let subscription_item_id = subscription
                    .items
                    .data
                    .first()
                    .ok_or_else(|| {
                        log::error!("CustomerSubscriptionCreated event has no subscription item");
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?
                    .id
                    .to_string();
                user.stripe_subscription_id = Some(subscription_item_id);
                user.subscribed = true;
                _ = user.save();
            };
        }
        (EventType::CustomerSubscriptionDeleted, EventObject::Subscription(subscription)) => {
            let email = subscription
                .customer
                .as_object()
                .ok_or_else(|| {
                    log::error!("CustomerSubscriptionDeleted event has no customer object");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?
                .email
                .as_deref()
                .ok_or_else(|| {
                    log::error!("CustomerSubscriptionDeleted event has no customer email");
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

            if let Ok(Some(mut user)) = User::by_email(email) {
                user.stripe_subscription_id = None;
                user.subscribed = false;
                _ = user.save();
            };
        }
        _ => {}
    };
    Ok((StatusCode::OK, ()))
}
