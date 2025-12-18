package structs

type ReceiptStatus string

const (
	ReceiptCompleted ReceiptStatus = "COMPLETED"
	ReceiptCancelled ReceiptStatus = "CANCELLED"
	InProgress       ReceiptStatus = "IN_PROGRESS"
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
	CancelledDate string             `json:"cancelled-date"`
	CancelledBy   string             `json:"cancelled-by"`
	Deleted       bool               `json:"deleted"`
}
