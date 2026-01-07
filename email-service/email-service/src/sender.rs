use crate::notification_event::{EventType, NotificationEvent, RecipientType};
use crate::template_structs::{OrderCreated, OrderInsufficientBalance, OrderItem};
use askama::Template;
use lettre::message::{header, Message, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::SmtpTransport;
use lettre::Transport;
use std::env;

pub(crate) async fn send_email(event: NotificationEvent, email: String) {
    match event.event_type {
        EventType::OrderInsufficientBalance => {
            let template = OrderInsufficientBalance {
                order_id: event.order_id,
                order_date: event
                    .data
                    .get("order_date")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap(),
                url: event.data.get("url").cloned().unwrap_or_default(),

                item_count: event
                    .data
                    .get("item_count")
                    .expect("Missing item_count")
                    .parse()
                    .expect("item_count is not a number"),

                total_amount: event
                    .data
                    .get("total_amount")
                    .expect("Missing total_amount")
                    .parse()
                    .expect("total_amount is not a number"),

                current_balance: event.data.get("current_balance").unwrap().parse().unwrap(),
                required_amount: event.data.get("required_amount").unwrap().parse().unwrap(),
                shortage_amount: event.data.get("shortage_amount").unwrap().parse().unwrap(),
            };
            let html_body = template.render().expect("Failed to render email template");

            send_email_from_template(email, html_body, "Order Insufficient Balance".parse().unwrap());
        }
        EventType::OrderPaymentCompleted => {}
        EventType::OrderApproved => {}
        EventType::OrderFulfilled => {}
        EventType::OrderCancelled => {}
        EventType::OrderCreated => {
            // 1. Parse products (Common data)
            let products_str = event.data.get("products").cloned().unwrap_or_default();
            let parts: Vec<&str> = products_str.split(',').collect();
            let mut items: Vec<OrderItem> = Vec::new();

            for chunk in parts.chunks(2) {
                if chunk.len() == 2 {
                    items.push(OrderItem {
                        name: chunk[0].to_string(),
                        quantity: chunk[1].parse().unwrap_or(1),
                    });
                }
            }

            // 2. Determine if THIS email is a Trader or User
            // We check if the email exists in the trader_recipients string
            let traders_str = event.data.get("trader_recipients").cloned().unwrap_or_default();
            let is_trader = traders_str.contains(&email);

            let (recipient_type_str, subject_line) = if is_trader {
                ("TRADER", "🔔 New Order Request Available")
            } else {
                ("USER", "✅ Order Successfully Created")
            };

            // 3. Populate Template
            let template = OrderCreated {
                order_id: event.data.get("order_id").cloned().unwrap_or_default(),
                order_date: event.data.get("order_date").cloned().unwrap_or_default(),
                due_date: event.data.get("due_date").cloned().unwrap_or_default(),
                url: event.data.get("url").cloned().unwrap_or_default(),
                item_count: event.data.get("item_count").and_then(|v| v.parse().ok()).unwrap_or(0),
                total_amount: event.data.get("total_amount").cloned().unwrap_or_default(),
                items,
                order_reference: event.data.get("order_reference").cloned().unwrap_or_default(),
                user_name: event.data.get("user_name").cloned().unwrap_or("Customer".to_string()),
                // Pass as String
                recipient_type: recipient_type_str.to_string(),
            };

            // 4. Render
            let html_body = template.render().expect("Failed to render template");

            // 5. Send (Using the correct Subject)
            send_email_from_template(email, html_body, subject_line.to_string());
        }
        EventType::OrderRejected => {}
        EventType::NewOrderPendingApproval => {}
        EventType::OrderFulfillmentReminderDay1 => {}
        EventType::OrderFulfillmentReminderDay2 => {}
        EventType::OrderFulfillmentReminderDay3 => {}
    }
}

fn send_email_from_template(email: String, html_body: String, subject: String) {
    let email = Message::builder()
        .from("josejosemou8@gmail.com".parse().unwrap())
        .to(email.parse().unwrap())
        .subject(subject)
        .singlepart(
            SinglePart::builder()
                .header(header::ContentType::TEXT_HTML)
                .body(html_body),
        )
        .unwrap();

    let smtp_username =
        env::var("SMTP_USERNAME").unwrap_or("josejosemou8@gmail.com".to_string());
    let smtp_password = env::var("SMTP_PASSWORD").unwrap_or("".to_string());
    let smtp_relay = "smtp.gmail.com";

    let credentials = Credentials::new(smtp_username.to_owned(), smtp_password.to_owned());

    let mailer = SmtpTransport::relay(smtp_relay)
        .unwrap()
        .credentials(credentials)
        .build();

    match mailer.send(&email) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => eprintln!("Failed to send email: {:?}", e),
    }
}
