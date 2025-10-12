package structs

import "time"

type Product struct {
	Id         string    `json:"id"`
	Name       string    `json:"name"`
	ExpiryDate time.Time `json:"expiryDate,omitempty"`
	Price      float64   `json:"price"`
	Quantity   int       `json:"quantity"`
}
