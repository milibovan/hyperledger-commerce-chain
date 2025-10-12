package structs

import "time"

type Receipt struct {
	Id         string    `json:"id"`
	Trader     Trader    `json:"trader"`
	User       User      `json:"user"`
	ProductIDs []string  `json:"products-ids"`
	Date       time.Time `json:"date"`
}
