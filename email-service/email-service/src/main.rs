use crate::kafka::consume_messages;

mod kafka;
mod notification_event;
mod sender;
mod template_structs;

#[tokio::main]
async fn main() {
    consume_messages().await;
}
