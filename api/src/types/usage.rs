use crate::{
    db::DB,
    lemonsqueezy::{UsageRecord, UsageRecordAction},
};
use chrono::{DateTime, Datelike, Timelike, Utc};
use eyre::Result;
use serde::{Deserialize, Serialize};

use super::user::User;
// use crate::routes::get::
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Usage {
    pub created_at: u64,
    pub items: Vec<UsageItem>,
    pub id: u64, //month timestamp + user id
    pub count: u32,
}

// #[derive(Debug, Deserialize, Serialize, Clone)]
// pub enum UsageStatus {
//     Active,
//     Failed,
//     Paid,
// }

/// UsageItem is reported to stripe for billing
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UsageItem {
    // number of words in a query message
    pub message_count: u16,
    // number of words in all sources
    pub source_word_count: u32,
    // number of remote uncached retrievals
    pub source_retrieval_count: u16,
    // url of the page that user sent message from
    pub page_url: String,
    // whether this item has been submitted to stripe
    pub submitted: bool,
    // id of the usage this item belongs to
    pub usage_id: u64,
    pub user_id: u64,
}

const USAGE_ITEM_THRESHOLD: usize = 50;

impl Usage {
    pub fn new(user_id: u64) -> Self {
        Self {
            created_at: chrono::Utc::now().timestamp() as u64,
            items: vec![],
            id: Self::id(get_current_month_timestamp(chrono::Utc::now()), user_id),
            count: 0,
        }
    }

    pub fn current_id(user_id: u64) -> u64 {
        Self::id(get_current_month_timestamp(chrono::Utc::now()), user_id)
    }

    pub fn id(timestamp: u32, user_id: u64) -> u64 {
        (timestamp as u64) << 32 | user_id
    }

    pub fn by_id(id: u64) -> Result<Option<Usage>> {
        DB.usage(id)
    }

    pub fn save(self) -> Result<Usage> {
        DB.usage_save(self)
    }

    pub fn add_item(mut self, item: UsageItem) -> Result<Usage> {
        self.items.push(item);
        self.count += 1;
        self.compact_items();
        self.save()
    }

    fn compact_items(&mut self) {
        //check if items.len > threshold
        //merge submitted items by page_url
        if self.items.len() >= USAGE_ITEM_THRESHOLD {
            let mut items = self.items.clone();
            items.sort_by(|a, b| a.page_url.cmp(&b.page_url));
            let mut merged_items = vec![];

            if let Some(current_item) = items.first() {
                let mut current_item = current_item.clone();
                for item in items {
                    if item.page_url == current_item.page_url {
                        current_item.message_count += item.message_count;
                        current_item.source_word_count += item.source_word_count;
                        current_item.source_retrieval_count += item.source_retrieval_count;
                    } else {
                        merged_items.push(current_item);
                        current_item = item;
                    }
                }
                merged_items.push(current_item);
                self.items = merged_items;
            }
        }
    }
}

impl UsageItem {
    pub async fn submit(mut self) -> Self {
        let units: u32 = (&self).into();

        if let Ok(Some(User {
            ls_subscription_id: Some(subscription_id),
            ..
        })) = User::by_id(self.user_id)
        {
            let usage_record = UsageRecord {
                quantity: units as u64,
                subscription_item_id: subscription_id,
                action: UsageRecordAction::Increment,
            };

            match usage_record.create().await {
                Ok(_) => {
                    self.submitted = true;
                }
                Err(e) => {
                    log::error!("Failed to submit usage item to stripe: {}", e);
                }
            }
        }

        self
    }

    pub fn save(self) -> Result<()> {
        let usage = Usage::by_id(self.usage_id)
            .map(|usage| usage.unwrap_or_else(|| Usage::new(self.usage_id)))?;
        usage.add_item(self)?;
        Ok(())
    }
}

impl From<&UsageItem> for u32 {
    fn from(item: &UsageItem) -> Self {
        let UsageItem {
            message_count,
            source_retrieval_count,
            source_word_count,
            ..
        } = item;

        *message_count as u32 * MESSAGE_UNIT
            + *source_retrieval_count as u32 * SOURCE_RETRIEVAL_UNIT
            + source_word_count * SOURCE_WORD_UNIT
    }
}

fn get_current_month_timestamp(date: DateTime<Utc>) -> u32 {
    date.with_day(1)
        .unwrap()
        .with_hour(0)
        .unwrap()
        .with_minute(0)
        .unwrap()
        .with_second(0)
        .unwrap()
        .with_nanosecond(0)
        .unwrap()
        .timestamp() as u32
}

const MESSAGE_UNIT: u32 = 1000;
const SOURCE_RETRIEVAL_UNIT: u32 = 100;
const SOURCE_WORD_UNIT: u32 = 1;
