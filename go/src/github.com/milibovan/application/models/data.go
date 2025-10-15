package models

import "time"

type Product struct {
	DocType    string     `json:"doc-type"`
	Id         string     `json:"id"`
	Name       string     `json:"name"`
	ExpiryDate time.Time  `json:"expiry-date,omitempty"`
	Price      float64    `json:"price"`
	Quantity   int        `json:"quantity"`
	TraderType TraderType `json:"trader-type"`
}

type Receipt struct {
	DocType    string    `json:"doc-type"`
	Id         string    `json:"id"`
	TraderId   string    `json:"trader-id"`
	UserId     string    `json:"user-id"`
	ProductIDs []string  `json:"products-ids"`
	Date       time.Time `json:"date"`
}

type TraderType string

const (
	SUPERMARKET TraderType = "SUPERMARKET"
	CARDEALER   TraderType = "CARDEALER"
	PHARMACY    TraderType = "PHARMACY"
	GROCERY     TraderType = "GROCERY"
	GAS_STATON  TraderType = "GAS_STATON"
)

type Trader struct {
	DocType              string     `json:"doc-type"`
	Id                   string     `json:"id"`
	TraderType           TraderType `json:"trader-type"`
	VAT                  string     `json:"vat"`
	ProductsAvailableIDs []string   `json:"products-available-ids"`
	ReceiptsIDs          []string   `json:"receipts-ids"`
	Balance              float64    `json:"balance"`
}

type User struct {
	DocType     string   `json:"doc-type"`
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	Surname     string   `json:"surname"`
	Email       string   `json:"email"`
	ReceiptsIDs []string `json:"receipts-ids"`
	Balance     float64  `json:"balance"`
}
