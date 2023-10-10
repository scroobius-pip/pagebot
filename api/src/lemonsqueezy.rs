use std::pin::Pin;

use eyre::Result;
use futures::Future;
use reqwest::Client as ReqwestClient;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::json;
#[derive(Debug, Clone, Deserialize)]
pub struct EventData {
    pub meta: EventMeta,
    pub data: Subscription,
}

#[derive(Debug, Clone, Deserialize)]
pub struct EventMeta {
    test_mode: bool,
    pub event_name: EventName,
}

#[derive(Debug, Clone, Deserialize)]
pub enum EventName {
    #[serde(rename = "subscription_created")]
    SubscriptionCreated,
    #[serde(rename = "subscription_cancelled")]
    SubscriptionCancelled,
    #[serde(rename = "subscription_updated")]
    SubscriptionUpdated,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Subscription {
    // id: String,
    pub attributes: SubscriptionAttributes,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SubscriptionAttributes {
    pub store_id: u64,
    pub customer_id: u64,
    pub user_email: String,
    pub user_name: String,
    pub status: SubscriptionAttributesStatus,
    pub first_subscription_item: SubscriptionItem,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SubscriptionItem {
    pub id: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub enum SubscriptionAttributesStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "expired")]
    Expired,
    #[serde(rename = "trialing")]
    Trialing,
    #[serde(rename = "past_due")]
    PastDue,
    #[serde(rename = "unpaid")]
    Unpaid,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UsageRecord {
    pub quantity: u64,
    pub subscription_item_id: u64,
    pub action: UsageRecordAction,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UsageRecordAction {
    Increment,
    Set,
}

impl UsageRecord {
    pub async fn create(self) -> Result<()> {
        let body = json!({
            "data": {
                "type": "usage-records",
                "attributes": {
                    "quantity": self.quantity,
                },
                "relationships": {
                    "subscription-item": {
                        "data": {
                            "type": "subscription-items",
                            "id": self.subscription_item_id.to_string(),
                        }
                    }
                }
            }
        });

        let client = ReqwestClient::new();
        let req = client
            .post("https://api.lemonsqueezy.com/v1/usage-records")
            .header("Accept", "application/vnd.api+json")
            .header("Content-Type", "application/vnd.api+json")
            .header(
                "Authorization",
                format!("Bearer {}", dotenv!("LS_SECRET_KEY")),
            )
            .json(&body);

        let res = req.send().await?;
        let status = res.status();

        if status.is_success() {
            Ok(())
        } else {
            Err(eyre::eyre!("Failed to create usage record: {}", status))
        }
    }
}
