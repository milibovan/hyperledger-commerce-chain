package structs

type User struct {
	DocType   string   `json:"doc-type"`
	Id        string   `json:"id"`
	Name      string   `json:"name"`
	Surname   string   `json:"surname"`
	Email     string   `json:"email"`
	OrdersIDs []string `json:"orders-ids"`
	Balance   float64  `json:"balance"`
	Deleted   bool     `json:"deleted"`
}
