// sender.rs
use crate::notification_event::{EventType, NotificationEvent, RecipientType};
use crate::template_structs::{PaymentCompleted, RequestApproved, RequestCreated, RequestFulfilled, RequestInsufficientBalance, RequestItem};
use askama::Template;
use chrono::DateTime;
use lettre::message::{header, Message, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::SmtpTransport;
use lettre::Transport;
use std::env;

pub(crate) async fn send_email(event: NotificationEvent) {
    match event.event_type {
        EventType::RequestInsufficientBalance => {
            let template = RequestInsufficientBalance {
                request_id: event
                    .data
                    .get("request_id")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                request_date: format_date_pretty(
                    &event.data.get("request_date").cloned().unwrap_or_default(),
                ), // Safe parse
                url: event.data.get("url").cloned().unwrap_or_default(),
                item_count: event
                    .data
                    .get("item_count")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0),
                total_amount: event
                    .data
                    .get("total_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap(),
                // Handle potentially missing keys safely
                current_balance: event
                    .data
                    .get("current_balance")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
                required_amount: event
                    .data
                    .get("required_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
                shortage_amount: event
                    .data
                    .get("shortage_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
            };

            let html_body = template.render().expect("Failed to render email template");

            let recipient = event.data.get("recipient").cloned().unwrap_or_default();
            if !recipient.is_empty() {
                send_email_via_smtp(
                    recipient,
                    html_body,
                    "Request Insufficient Balance".to_string(),
                );
            }
        }
        EventType::RequestPaymentCompleted => {
            let template = PaymentCompleted {
                request_id: event
                    .data
                    .get("request_id")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                payment_date: format_date_pretty(
                    &event
                        .data
                        .get("payment_date")
                        .cloned()
                        .unwrap_or_default(),
                ), // Safe parse
                transaction_id: event
                    .data
                    .get("transaction_id")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                total_amount: event
                    .data
                    .get("total_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
                url: event
                    .data
                    .get("url")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
            };

            for recipient_type in &event.recipient_types {
                match recipient_type {
                    RecipientType::USER => {
                        let html_body = template.render().expect("Failed to render email template");
                        let user_email = event.data.get("recipients").cloned().unwrap_or_default();
                        if !user_email.is_empty() {
                            send_email_via_smtp(
                                user_email,
                                html_body,
                                "✅ Payment successful".to_string(),
                            );
                        }
                    }
                    RecipientType::TRADER => {
                        let html_body = template.render().expect("Failed to render email template");
                        let traders_str = event
                            .data
                            .get("trader_recipients")
                            .cloned()
                            .unwrap_or_default();
                        if !traders_str.is_empty() {
                            let html_body =
                                template.render().expect("Failed to render Trader template");

                            for trader_email in traders_str.split(',') {
                                let email_clean = trader_email.trim();
                                if !email_clean.is_empty() {
                                    send_email_via_smtp(
                                        email_clean.to_string(),
                                        html_body.clone(),
                                        "✅ Payment successful".to_string(),
                                    );
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        EventType::RequestApproved => {
            let template = RequestApproved {
                request_id: event
                    .data
                    .get("request_id")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                approval_date: format_date_pretty(
                    &event.data.get("approval_date").cloned().unwrap_or_default(),
                ), // Safe parse
                url: event.data.get("url").cloned().unwrap_or_default(),
                trader_name: event
                    .data
                    .get("trader_name")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                trader_email: event
                    .data
                    .get("trader_email")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                deadline_date: format_date_pretty(
                    &event.data.get("deadline_date").cloned().unwrap_or_default(),
                ),
                total_amount: event
                    .data
                    .get("total_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
            };

            let html_body = template.render().expect("Failed to render email template");

            let recipient = event.data.get("recipient").cloned().unwrap_or_default();
            if !recipient.is_empty() {
                send_email_via_smtp(recipient, html_body, "✅ Request Approved".to_string());
            }
        }
        EventType::RequestFulfilled => {
            let template = RequestFulfilled {
                request_id: event
                    .data
                    .get("request_id")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                completed_date: format_date_pretty(
                    &event
                        .data
                        .get("completed_date")
                        .cloned()
                        .unwrap_or_default(),
                ), // Safe parse
                trader_name: event
                    .data
                    .get("trader_name")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                item_count: event
                    .data
                    .get("item_count")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0),
                total_amount: event
                    .data
                    .get("total_amount")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or(0.0),
                request_url: event
                    .data
                    .get("request_url")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                review_url: event
                    .data
                    .get("review_url")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
                fulfillment_time: event
                    .data
                    .get("fulfillment_time")
                    .cloned()
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default(),
            };

            for recipient_type in &event.recipient_types {
                match recipient_type {
                    RecipientType::USER => {
                        let html_body = template.render().expect("Failed to render email template");
                        let user_email = event.data.get("recipients").cloned().unwrap_or_default();
                        if !user_email.is_empty() {
                            send_email_via_smtp(
                                user_email,
                                html_body,
                                "✅ Request Successfully Fulfilled".to_string(),
                            );
                        }
                    }
                    RecipientType::TRADER => {
                        let html_body = template.render().expect("Failed to render email template");
                        let traders_str = event
                            .data
                            .get("trader_recipients")
                            .cloned()
                            .unwrap_or_default();
                        if !traders_str.is_empty() {
                            let html_body =
                                template.render().expect("Failed to render Trader template");

                            for trader_email in traders_str.split(',') {
                                let email_clean = trader_email.trim();
                                if !email_clean.is_empty() {
                                    send_email_via_smtp(
                                        email_clean.to_string(),
                                        html_body.clone(),
                                        "✅ Request Successfully Fulfilled".to_string(),
                                    );
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        EventType::RequestCancelled => {}
        EventType::RequestCreated => {
            let products_str = event.data.get("products").cloned().unwrap_or_default();
            let parts: Vec<&str> = products_str.split(',').collect();
            let mut items: Vec<RequestItem> = Vec::new();

            for chunk in parts.chunks(2) {
                if chunk.len() == 2 {
                    items.push(RequestItem {
                        name: chunk[0].to_string(),
                        quantity: chunk[1].parse().unwrap_or(1),
                    });
                }
            }

            let base_template = RequestCreated {
                request_id: event.data.get("request_id").cloned().unwrap_or_default(),
                request_date: format_date_pretty(
                    &event.data.get("request_date").cloned().unwrap_or_default(),
                ),

                due_date: format_date_pretty(
                    &event.data.get("due_date").cloned().unwrap_or_default(),
                ),
                url: event.data.get("url").cloned().unwrap_or_default(),
                item_count: event
                    .data
                    .get("item_count")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0),
                total_amount: event.data.get("total_amount").cloned().unwrap_or_default(),
                items,
                request_reference: event
                    .data
                    .get("request_reference")
                    .cloned()
                    .unwrap_or_default(),
                user_name: event
                    .data
                    .get("user_name")
                    .cloned()
                    .unwrap_or("Customer".to_string()),
                recipient_type: String::new(),
            };

            for recipient_type in &event.recipient_types {
                match recipient_type {
                    RecipientType::USER => {
                        let user_email = event.data.get("recipients").cloned().unwrap_or_default();
                        if !user_email.is_empty() {
                            let mut template = base_template.clone();
                            template.recipient_type = "USER".to_string();
                            let html_body =
                                template.render().expect("Failed to render User template");

                            send_email_via_smtp(
                                user_email,
                                html_body,
                                "✅ Request Successfully Created".to_string(),
                            );
                        }
                    }
                    RecipientType::TRADER => {
                        let traders_str = event
                            .data
                            .get("trader_recipients")
                            .cloned()
                            .unwrap_or_default();
                        if !traders_str.is_empty() {
                            let mut template = base_template.clone();
                            template.recipient_type = "TRADER".to_string();
                            let html_body =
                                template.render().expect("Failed to render Trader template");

                            for trader_email in traders_str.split(',') {
                                let email_clean = trader_email.trim();
                                if !email_clean.is_empty() {
                                    send_email_via_smtp(
                                        email_clean.to_string(),
                                        html_body.clone(),
                                        "🔔 New Request Available".to_string(),
                                    );
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        EventType::RequestRejected => {}
        EventType::RequestFulfillmentReminderDay1 => {}
        EventType::RequestFulfillmentReminderDay2 => {}
        EventType::RequestFulfillmentReminderDay3 => {}
        _ => {}
    }
}

// FIXED: Cleaned up signature
fn send_email_via_smtp(email: String, html_body: String, subject: String) {
    // ... (SMTP logic same as before)
    let email_msg = Message::builder()
        .from(
            "Chaincode Trade Team <josejosemou8@gmail.com>"
                .parse()
                .unwrap(),
        )
        .to(email.parse().unwrap())
        .subject(subject)
        .singlepart(
            SinglePart::builder()
                .header(header::ContentType::TEXT_HTML)
                .body(html_body),
        )
        .unwrap();

    let smtp_username = env::var("SMTP_USERNAME").unwrap_or("josejosemou8@gmail.com".to_string());
    let smtp_password = env::var("SMTP_PASSWORD").unwrap_or("".to_string());
    let smtp_relay = "smtp.gmail.com";

    let credentials = Credentials::new(smtp_username, smtp_password);

    let mailer = SmtpTransport::relay(smtp_relay)
        .unwrap()
        .credentials(credentials)
        .build();

    match mailer.send(&email_msg) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => eprintln!("Failed to send email: {:?}", e),
    }
}

fn format_date_pretty(date_str: &str) -> String {
    // 1. Parse the RFC3339 string (e.g., "2026-01-07T22:33:42Z")
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        // 2. Format it to match "en-US" style:
        // %B = Full Month Name (January)
        // %d = Day (08)
        // %Y = Year (2026)
        // %I = Hour 12-hour clock (12)
        // %M = Minute (42)
        // %p = AM/PM
        return dt.format("%B %d, %Y at %I:%M %p").to_string();
    }
    // Fallback if parsing fails
    date_str.to_string()
}
