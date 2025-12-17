package structs

type OrderStatus string

const (
	OrderPending   OrderStatus = "PENDING"
	OrderApproved  OrderStatus = "APPROVED"
	OrderRejected  OrderStatus = "REJECTED"
	OrderFulfilled OrderStatus = "FULFILLED"
	OrderCancelled OrderStatus = "CANCELLED"
)

type Order struct {
	DocType      string             `json:"doc-type"`
	Id           string             `json:"id"`
	UserId       string             `json:"user-id"`
	Status       OrderStatus        `json:"status"`
	CreatedDate  string             `json:"created-date"`
	Products     []ProductInventory `json:"products"`
	ReceiptsIds  []string           `json:"receipts-ids"`
	TotalCost    float64            `json:"total-cost"`
	ApprovedDate string             `json:"approved-date,omitempty"`
	Deleted      bool               `json:"deleted"`
}
