use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    OrderInsufficientBalance,
    OrderPaymentCompleted,
    OrderApproved,
    OrderFulfilled,
    OrderCancelled,
    OrderCreated,
    OrderRejected,
    NewOrderPendingApproval,
    OrderFulfillmentReminderDay1,
    OrderFulfillmentReminderDay2,
    OrderFulfillmentReminderDay3,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RecipientType {
    USER,
    TRADER,
    ADMIN,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Channels {
    EMAIL,
    SMS,
    PUSH,
    InApp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationEvent {
    pub id: String,

    pub event_type: EventType,

    pub recipient_types: Vec<RecipientType>,

    pub recipient_id: String,

    pub timestamp: Option<i64>,

    pub scheduled_send_time: Option<i64>,

    pub channel: Channels,

    #[serde(default)]
    pub order_id: String,

    #[serde(default)]
    pub user_id: String,

    #[serde(default)]
    pub trader_id: String,

    pub data: HashMap<String, String>,
}