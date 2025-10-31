package models

import (
	"fmt"
	"strings"
	"time"
)

type Product struct {
	DocType    string     `json:"doc-type"`
	Id         string     `json:"id"`
	Name       string     `json:"name"`
	ExpiryDate CustomTime `json:"expiry-date,omitempty"`
	Price      float64    `json:"price"`
	Quantity   int        `json:"quantity"`
	TraderType TraderType `json:"trader-type"`
	Deleted    bool       `json:"deleted"`
}

type Receipt struct {
	DocType    string    `json:"doc-type"`
	Id         string    `json:"id"`
	TraderId   string    `json:"trader-id"`
	UserId     string    `json:"user-id"`
	ProductIDs []string  `json:"products-ids"`
	Date       time.Time `json:"date"`
	Deleted    bool      `json:"deleted"`
}

type TraderType string

const (
	SUPERMARKET TraderType = "SUPERMARKET"
	CARDEALER   TraderType = "CARDEALER"
	PHARMACY    TraderType = "PHARMACY"
	GROCERY     TraderType = "GROCERY"
	GAS_STATION TraderType = "GAS_STATION"
)

type Trader struct {
	DocType              string     `json:"doc-type"`
	Id                   string     `json:"id"`
	Name                 string     `json:"name"`
	TraderType           TraderType `json:"trader-type"`
	VAT                  string     `json:"vat"`
	ProductsAvailableIDs []string   `json:"products-available-ids"`
	ReceiptsIDs          []string   `json:"receipts-ids"`
	Balance              float64    `json:"balance"`
	Deleted              bool       `json:"deleted"`
}

type User struct {
	DocType     string   `json:"doc-type"`
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	Surname     string   `json:"surname"`
	Email       string   `json:"email"`
	ReceiptsIDs []string `json:"receipts-ids"`
	Balance     float64  `json:"balance"`
	Deleted     bool     `json:"deleted"`
}

type CustomTime struct {
	time.Time
}

func (ct *CustomTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	if s == "null" || s == "" {
		return nil
	}

	t, err := time.Parse("2006-01-02 15:04:05", s)
	if err != nil {
		return err
	}
	ct.Time = t
	return nil
}

func (ct CustomTime) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf("\"%s\"", ct.Format("2006-01-02 15:04:05"))), nil
}

type DepositObject struct {
	UserId string  `json:"user-id"`
	Amount float64 `json:"amount"`
}
