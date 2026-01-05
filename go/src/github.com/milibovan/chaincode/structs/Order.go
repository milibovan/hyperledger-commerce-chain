package structs

type Order struct {
	DocType     string             `json:"doc-type"`
	Id          string             `json:"id"`
	UserId      string             `json:"user-id"`
	CreatedDate string             `json:"created-date"`
	Products    []ProductInventory `json:"products"`
	ReceiptsIds []string           `json:"receipts-ids"`
	TotalCost   float64            `json:"total-cost"`
	Deleted     bool               `json:"deleted"`
}
