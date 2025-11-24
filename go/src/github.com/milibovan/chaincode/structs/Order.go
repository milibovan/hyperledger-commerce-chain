package structs

type Order struct {
	DocType     string             `json:"doc-type"`
	Id          string             `json:"id"`
	UserId      string             `json:"user-id"`
	Products    []ProductInventory `json:"products"`
	ReceiptsIds []string           `json:"receipts-ids"`
	Deleted     bool               `json:"deleted"`
}
