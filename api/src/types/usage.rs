use crate::db::DB;
use chrono::{Datelike, Timelike};
use eyre::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Usage {
    pub created_at: u64,
    pub items: Vec<UsageItem>,
    pub id: u64, //month timestamp + user id
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
}

const USAGE_ITEM_THRESHOLD: usize = 100;

impl Usage {
    pub fn new(user_id: u64) -> Self {
        Self {
            created_at: chrono::Utc::now().timestamp() as u64,
            items: vec![],
            id: Self::id(get_current_month_timestamp(), user_id),
        }
    }

    pub fn current_id(user_id: u64) -> u64 {
        Self::id(get_current_month_timestamp(), user_id)
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
            let mut current_item = items[0].clone();
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

impl UsageItem {
    pub async fn submit(mut self) -> Result<Self> {
        // unimplemented!();
        //send to stripe
        //update submitted
        //return self
        self.submitted = true;
        Ok(self)
    }

    pub fn save(self) -> Result<()> {
        let usage = Usage::by_id(self.usage_id)
            .map(|usage| usage.unwrap_or_else(|| Usage::new(self.usage_id)))?;
        usage.add_item(self)?;
        Ok(())
    }
}

fn get_current_month_timestamp() -> u32 {
    chrono::Utc::now()
        .with_day(1)
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
