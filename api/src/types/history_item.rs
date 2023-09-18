use std::fmt::{Display, Formatter};

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct HistoryItem {
    pub bot: bool,
    pub content: String,
}

impl Display for HistoryItem {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        // write!(f, "{}", self.content)
        //PageBot: **Hey!**, _how can I help you today?_
        //User: What is the capital of France?
        write!(
            f,
            "{}: {}",
            if self.bot { "PageBot" } else { "User" },
            self.content
        )
    }
}

pub fn history_to_string(history: Vec<HistoryItem>) -> String {
    history
        .iter()
        .map(|item| item.to_string())
        .collect::<Vec<_>>()
        .join("<br>")
}
