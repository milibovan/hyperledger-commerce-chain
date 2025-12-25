use crate::kafka::consume_messages;

mod kafka;
mod notification_event;

#[tokio::main]
async fn main() {
    consume_messages().await;
}
