use crate::{
    routes::{GenericResponse, JsonResponse},
    STRIPE_CLIENT,
};
use axum::{
    extract::{Path, Query},
    Json,
};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use stripe::{
    CheckoutSession, CheckoutSessionMode, CheckoutSessionPaymentMethodCollection, Client,
    CreateCheckoutSession, CreateCheckoutSessionLineItems, CreateCheckoutSessionSubscriptionData,
    CreateCheckoutSessionSubscriptionDataTrialSettings,
    CreateCheckoutSessionSubscriptionDataTrialSettingsEndBehavior,
    CreateCheckoutSessionSubscriptionDataTrialSettingsEndBehaviorMissingPaymentMethod,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Params {
    ref_id: Option<String>,
    host: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Response {
    url: String,
}

pub async fn main(
    Query(Params { ref_id, host }): Query<Params>,
    // Path(product_id): Path<String>,
) -> JsonResponse<Response> {
    let cancel_url: &str = &format!("{}?payment=false", host);
    let success_url: &str = &format!("{}?payment=true", host);
    let product_id: String = "price_1NenaCCjDSIDWyvtP3bxWHlX".into();
    let client_reference_id: Option<&str> = ref_id.as_deref();

    let params = CreateCheckoutSession {
        line_items: vec![
            CreateCheckoutSessionLineItems {
                price: Some(product_id),
                // quantity: 1.into(),
                ..Default::default()
            }
        ].into(),
        subscription_data: Some(CreateCheckoutSessionSubscriptionData {
            trial_settings: Some(CreateCheckoutSessionSubscriptionDataTrialSettings {
                end_behavior: CreateCheckoutSessionSubscriptionDataTrialSettingsEndBehavior {
                    missing_payment_method: CreateCheckoutSessionSubscriptionDataTrialSettingsEndBehaviorMissingPaymentMethod::Cancel
                }
            }),
            ..Default::default()
        }),
        mode: CheckoutSessionMode::Subscription.into(),
        payment_method_collection: Some(CheckoutSessionPaymentMethodCollection::IfRequired),
        cancel_url: Some(cancel_url),
        client_reference_id,
        ..CreateCheckoutSession::new(success_url)
    };

    let checkout_session_url = CheckoutSession::create(&STRIPE_CLIENT, params)
        .await
        .map(|session| session.url)
        .map_err(|err| {
            log::error!("Failed to create checkout session: {:?}", err);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            log::error!("Failed to create checkout session: no url returned");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok((
        StatusCode::OK,
        Json(Response {
            url: checkout_session_url,
        }),
    ))
}
