package structs

import "time"

type Receipt struct {
	DocType    string    `json:"doc-type"`
	Id         string    `json:"id"`
	TraderId   string    `json:"trader-id"`
	UserId     string    `json:"user-id"`
	ProductIDs []string  `json:"products-ids"`
	Date       time.Time `json:"date"`
}
