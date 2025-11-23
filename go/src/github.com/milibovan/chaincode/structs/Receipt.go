package structs

type Receipt struct {
	DocType  string             `json:"doc-type"`
	Id       string             `json:"id"`
	TraderId string             `json:"trader-id"`
	UserId   string             `json:"user-id"`
	Products []ProductInventory `json:"products"`
	Date     string             `json:"date"`
	Deleted  bool               `json:"deleted"`
}
