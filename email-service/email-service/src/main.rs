use crate::kafka::consume_messages;

mod kafka;

#[tokio::main]
async fn main() {
    consume_messages().await;
}
