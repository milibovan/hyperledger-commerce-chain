use askama::Template;
use chrono::{DateTime, Utc};

#[derive(Template)]
#[template(path="../templates/new_order_pending_approval.html")]
struct OrderPendingApproval {
    order_id: String,
    order_date: DateTime<Utc>,
    item_count: i32,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/insufficient_balance.html")]
struct InsufficientBalance {
    order_id: String,
    order_date: DateTime<Utc>,
    item_count: i32,
    total_amount: f32,
    current_balance: f32,
    required_amount: f32,
    shortage_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_approved.html")]
struct OrderApproved {
    order_id: String,
    approval_date: DateTime<Utc>,
    trader_name: String,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_cancelled.html")]
struct OrderCancelled {
    order_id: String,
    cancelled_date: DateTime<Utc>,
    total_amount: f32,
    cancellation_reason: String,
    refund_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_fulfilled.html")]
struct OrderFulfilled {
    order_id: String,
    cancelled_date: DateTime<Utc>,
    trader_name: String,
    item_count: i32,
    total_amount: f32,
    order_url: String,
    review_url: String,
    fulfillment_time: DateTime<Utc>
}

#[derive(Template)]
#[template(path="../templates/order_fulfillment_reminder_day1.html")]
struct OrderFulfillmentReminderDay1 {
    days_remaining: i32,
    order_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_fulfillment_reminder_day2.html")]
struct OrderFulfillmentReminderDay2 {
    days_remaining: i32,
    order_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_fulfillment_reminder_day3.html")]
struct OrderFulfillmentReminderDay3 {
    days_remaining: i32,
    order_id: String,
    approval_date: DateTime<Utc>,
    deadline_date: DateTime<Utc>,
    total_amount: f32,
    hours_remaining: i32,
    url: String,
}

#[derive(Template)]
#[template(path="../templates/order_rejected.html")]
struct OrderRejected {
    order_id: String,
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
struct PaymentCompleted {
    order_id: String,
    payment_date: DateTime<Utc>,
    transaction_id: String,
    total_amount: f32,
    url: String,
}