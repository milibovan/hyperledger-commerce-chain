use crate::kafka::start_consumer;

mod kafka;
mod notification_event;
mod sender;
mod template_structs;

#[tokio::main]
async fn main() {
    start_consumer().await;
}
