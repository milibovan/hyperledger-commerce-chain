use askama::Template;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestItem {
    pub name: String,
    pub quantity: i32,
}

#[derive(Template)]
#[template(path="../templates/new_request_pending_approval.html")]
pub struct RequestPendingApproval {
    request_id: String,
    request_date: DateTime<Utc>,
    item_count: i32,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/insufficient_balance.html")]
pub struct RequestInsufficientBalance {
    pub(crate) request_id: String,
    pub(crate) request_date: DateTime<Utc>,
    pub(crate) item_count: i32,
    pub(crate) total_amount: f32,
    pub(crate) current_balance: f32,
    pub(crate) required_amount: f32,
    pub(crate) shortage_amount: f32,
    pub(crate) url: String,
}

#[derive(Template)]
#[template(path="../templates/request_approved.html")]
pub struct RequestApproved {
    pub(crate) request_id: String,
    pub(crate) approval_date: DateTime<Utc>,
    pub(crate) trader_name: String,
    pub(crate) trader_email: String,
    pub(crate) deadline_date: DateTime<Utc>,
    pub(crate) total_amount: f32,
    pub(crate) url: String,
}

#[derive(Template)]
#[template(path="../templates/request_cancelled.html")]
pub struct RequestCancelled {
    request_id: String,
    cancelled_date: DateTime<Utc>,
    total_amount: f32,
    cancellation_reason: String,
    refund_amount: f32,
    url: String,
}

#[derive(Template, Clone)]
#[template(path = "request_created.html")]
pub struct RequestCreated {
    pub request_id: String,
    pub request_date: String,
    pub due_date: String,
    pub item_count: i32,
    pub total_amount: String,
    pub items: Vec<RequestItem>,
    pub url: String,
    pub request_reference: String,
    pub user_name: String,
    pub recipient_type: String,
}

#[derive(Template)]
#[template(path="../templates/request_fulfilled.html")]
pub struct RequestFulfilled {
    request_id: String,
    cancelled_date: DateTime<Utc>,
    trader_name: String,
    item_count: i32,
    total_amount: f32,
    request_url: String,
    review_url: String,
    fulfillment_time: DateTime<Utc>
}

#[derive(Template)]
#[template(path="../templates/request_fulfillment_reminder_day1.html")]
pub struct RequestFulfillmentReminderDay1 {
    days_remaining: i32,
    request_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/request_fulfillment_reminder_day2.html")]
pub struct RequestFulfillmentReminderDay2 {
    days_remaining: i32,
    request_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/request_fulfillment_reminder_day3.html")]
pub struct RequestFulfillmentReminderDay3 {
    days_remaining: i32,
    request_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    hours_remaining: i32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/request_rejected.html")]
pub struct RequestRejected {
    request_id: String,
    rejection_date: DateTime<Utc>,
    trader_name: String,
    total_amount: f32,
    rejection_reason: String,
    trader_message: String,
    refund_amount: f32,
    url: String
}

#[derive(Template)]
#[template(path="../templates/payment_completed.html")]
pub struct PaymentCompleted {
    request_id: String,
    payment_date: DateTime<Utc>,
    transaction_id: String,
    total_amount: f32,
    url: String,
}