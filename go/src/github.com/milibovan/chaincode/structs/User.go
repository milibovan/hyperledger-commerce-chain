package structs

type User struct {
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	Surname     string   `json:"surname"`
	Email       string   `json:"email"`
	ReceiptsIDs []string `json:"receipts-ids"`
	Balance     int      `json:"balance"`
}
