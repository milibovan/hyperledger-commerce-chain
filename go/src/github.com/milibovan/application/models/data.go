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

type ReceiptStatus string

const (
	ReceiptCompleted ReceiptStatus = "COMPLETED"
	ReceiptCancelled ReceiptStatus = "CANCELLED"
	InProgress       ReceiptStatus = "IN_PROGRESS"
)

type Receipt struct {
	DocType       string             `json:"doc-type"`
	Id            string             `json:"id"`
	TraderId      string             `json:"trader-id"`
	UserId        string             `json:"user-id"`
	OrderId       string             `json:"order-id"`
	Products      []ProductInventory `json:"products"`
	Date          string             `json:"date"`
	TotalCost     float64            `json:"total-cost"`
	Status        ReceiptStatus      `json:"status"`
	CancelledDate string             `json:"cancelled-date,omitempty"`
	CancelledBy   string             `json:"cancelled-by,omitempty"`
	Deleted       bool               `json:"deleted"`
}

type OrderStatus string

const (
	Pending   OrderStatus = "PENDING"
	Approved  OrderStatus = "APPROVED"
	Rejected  OrderStatus = "REJECTED"
	Fulfilled OrderStatus = "FULFILLED"
	Cancelled OrderStatus = "CANCELLED"
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

type TraderType string

const (
	SUPERMARKET TraderType = "SUPERMARKET"
	CARDEALER   TraderType = "CARDEALER"
	PHARMACY    TraderType = "PHARMACY"
	GROCERY     TraderType = "GROCERY"
	GAS_STATION TraderType = "GAS_STATION"
)

type Trader struct {
	DocType           string             `json:"doc-type"`
	Id                string             `json:"id"`
	Name              string             `json:"name"`
	Email             string             `json:"email"`
	TraderType        TraderType         `json:"trader-type"`
	VAT               string             `json:"vat"`
	ProductsAvailable []ProductInventory `json:"products-available"`
	ReceiptsIDs       []string           `json:"receipts-ids"`
	Balance           float64            `json:"balance"`
	Deleted           bool               `json:"deleted"`
}

type User struct {
	DocType   string   `json:"doc-type"`
	Id        string   `json:"id"`
	Name      string   `json:"name"`
	Surname   string   `json:"surname"`
	Email     string   `json:"email"`
	OrdersIds []string `json:"orders-ids"`
	Balance   float64  `json:"balance"`
	Deleted   bool     `json:"deleted"`
}

type CustomTime struct {
	time.Time
}

func (ct *CustomTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	if s == "null" || s == "" {
		return nil
	}

	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, err = time.Parse("2006-01-02 15:04:05", s)
		if err != nil {
			return err
		}
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

type ProductInventory struct {
	ProductId string `json:"product-id"`
	Quantity  int32  `json:"quantity"`
}

type RequestProducts struct {
	ProductId    string `json:"product-id"`
	Quantity     int32  `json:"quantity"`
	DeliveryDays int32  `json:"delivery-days"`
}
