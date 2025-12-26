use crate::kafka::consume_messages;
use crate::sender::send_email;

mod kafka;
mod notification_event;
mod sender;
mod template_structs;

#[tokio::main]
async fn main() {
    let notification_event = consume_messages().await;
    let recipients_str = notification_event
        .data
        .get("recipients")
        .expect("Missing recipients");
    let recipients = recipients_str.split("|");

    for recipient in recipients {
        send_email(notification_event.clone(), recipient.parse().unwrap()).await
    }
}
