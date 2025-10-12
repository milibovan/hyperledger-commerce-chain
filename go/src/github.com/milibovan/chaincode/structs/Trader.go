package structs

import "fmt"

type TraderType string

const (
	SUPERMARKET TraderType = "SUPERMARKET"
	CARDEALER   TraderType = "CARDEALER"
	PHARMACY    TraderType = "PHARMACY"
	GROCERY     TraderType = "GROCERY"
	GAS_STATON  TraderType = "GAS_STATON"
)

type Trader struct {
	Id                   string     `json:"id"`
	TraderType           TraderType `json:"trader-type"`
	VAT                  string     `json:"vat"`
	ProductsAvailableIDs []string   `json:"products-available-ids"`
	ReceiptsIDs          []string   `json:"receipts-ids"`
	Balance              float64    `json:"balance"`
}

func GetTraderTypeFromString(input string) (TraderType, error) {
	traderType := TraderType(input)

	switch traderType {
	case SUPERMARKET, CARDEALER, PHARMACY, GROCERY, GAS_STATON:
		return traderType, nil
	default:
		return "", fmt.Errorf("invalid or unsupported trader type: %s", input)
	}
}
