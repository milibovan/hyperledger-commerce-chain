package structs

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
