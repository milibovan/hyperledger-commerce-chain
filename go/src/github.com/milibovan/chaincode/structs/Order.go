package structs

type OrderStatus string

const (
	Pending   OrderStatus = "PENDING"
	Approved  OrderStatus = "APPROVED"
	Rejected  OrderStatus = "REJECTED"
	Fulfilled OrderStatus = "FULFILLED"
	Cancelled OrderStatus = "CANCELLED"
)

type Order struct {
	DocType     string             `json:"doc-type"`
	Id          string             `json:"id"`
	UserId      string             `json:"user-id"`
	Status      OrderStatus        `json:"status"`
	CreatedDate string             `json:"created-date"`
	Products    []ProductInventory `json:"products"`
	ReceiptsIds []string           `json:"receipts-ids"`
	TotalCost   float64            `json:"total-cost"`
	RequestId   string             `json:"request-id"`
	Deleted     bool               `json:"deleted"`
}
