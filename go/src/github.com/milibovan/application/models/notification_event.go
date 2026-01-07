package models

import (
	"time"
)

type EventTypes string

const (
	OrderCreated                 EventTypes = "OrderCreated"
	OrderInsufficientBalance     EventTypes = "OrderInsufficientBalance"
	OrderPaymentCompleted        EventTypes = "OrderPaymentCompleted"
	OrderApproved                EventTypes = "OrderApproved"
	OrderFulfilled               EventTypes = "OrderFulfilled"
	OrderCancelled               EventTypes = "OrderCancelled"
	OrderRejected                EventTypes = "OrderRejected"
	NewOrderPendingApproval      EventTypes = "NewOrderPendingApproval"
	OrderFulfillmentReminderDay1 EventTypes = "OrderFulfillmentReminderDay1"
	OrderFulfillmentReminderDay2 EventTypes = "OrderFulfillmentReminderDay2"
	OrderFulfillmentReminderDay3 EventTypes = "OrderFulfillmentReminderDay3"
)

type RecipientType string

const (
	USER   RecipientType = "USER"
	TRADER RecipientType = "TRADER"
	ADMIN  RecipientType = "ADMIN"
)

type Channels string

const (
	EMAIL Channels = "EMAIL"
	SMS   Channels = "SMS"
	PUSH  Channels = "PUSH"
	InApp Channels = "InApp"
)

type NotificationEvent struct {
	Id string `avro:"id"`
	// Event type and also email template.
	EventType EventTypes `avro:"event_type"`
	// Who should receive this notification.
	RecipientType []RecipientType `avro:"recipient_type"`
	// ID of the recipient (user_id or trader_id).
	RecipientID string     `avro:"recipient_id"`
	Timestamp   *time.Time `avro:"timestamp"`
	// If set, send notification at this time (Unix timestamp). Null = send immediately.
	ScheduledSendTime *time.Time `avro:"scheduled_send_time"`
	// Which channel notification should be sent to.
	Channel  Channels          `avro:"channel"`
	OrderID  string            `avro:"order_id"`
	UserID   string            `avro:"user_id"`
	TraderID string            `avro:"trader_id"`
	Data     map[string]string `avro:"data"`
}
