use crate::types::history_item::HistoryItem;

const DAILY_STATS: &str = include_str!("daily_stats.html");
const SOURCE_ERROR: &str = include_str!("source_error.html");
const KNOWLEDGE_GAP: &str = include_str!("knowledge_gap.html");
const FORWARDING: &str = include_str!("forwarding.html");
const FORWARDING_MESSAGE: &str = include_str!("forwarding_message.html");
// pub struct Forwarding(pub String);

pub fn render_forwarding(email: String, message: String, history: Vec<HistoryItem>) -> String {
    let mut forwarding_template = FORWARDING.to_string();
    forwarding_template = forwarding_template.replace("{{EMAIL}}", &email);
    forwarding_template = forwarding_template.replace("{{MESSAGE}}", &message);

    let rendered_forwarding_messages = history
        .iter()
        .map(|item| {
            let mut message_template = FORWARDING_MESSAGE.to_string();
            message_template = message_template.replace("{{MESSAGE}}", &item.content);
            let (background_color, text_color) = if item.bot {
                ("#f5f5f5", "#000000")
            } else {
                ("#000000", "#ffffff")
            };
            message_template = message_template.replace("{{BACKGROUND_COLOR}}", background_color);
            message_template = message_template.replace("{{TEXT_COLOR}}", text_color);
            message_template
        })
        .collect::<Vec<String>>()
        .join("");

    forwarding_template.replace("{{MESSAGES}}", &rendered_forwarding_messages)
}

pub fn render_source_error(url: &str) -> String {
    let mut source_error_template = SOURCE_ERROR.to_string();
    source_error_template = source_error_template.replace("{{SOURCE_URL}}", url);
    source_error_template
}

pub fn render_knowledge_gap(query: &str) -> String {
    let mut knowledge_gap_template = KNOWLEDGE_GAP.to_string();
    knowledge_gap_template = knowledge_gap_template.replace("{{QUERY}}", query);
    knowledge_gap_template
}
