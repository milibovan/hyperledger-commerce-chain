package structs

type User struct {
	DocType     string   `json:"doc-type"`
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	Surname     string   `json:"surname"`
	Email       string   `json:"email"`
	ReceiptsIDs []string `json:"receipts-ids"`
	Balance     float64  `json:"balance"`
}
