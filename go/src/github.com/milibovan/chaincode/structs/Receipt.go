package structs

import "time"

type ReceiptStatus string

const (
	COMPLETED   ReceiptStatus = "COMPLETED"
	CANCELED    ReceiptStatus = "CANCELED"
	IN_PROGRESS ReceiptStatus = "IN_PROGRESS"
)

type Receipt struct {
	DocType       string             `json:"doc-type"`
	Id            string             `json:"id"`
	TraderId      string             `json:"trader-id"`
	UserId        string             `json:"user-id"`
	OrderId       string             `json:"order-id"`
	Products      []ProductInventory `json:"products"`
	Date          string             `json:"date"`
	TotalCost     float64            `json:"total-cost"`
	Status        ReceiptStatus      `json:"status"`
	CancelledDate time.Time          `json:"cancelled-date,omitempty"`
	CancelledBy   string             `json:"cancelled-by,omitempty"`
	Deleted       bool               `json:"deleted"`
}
