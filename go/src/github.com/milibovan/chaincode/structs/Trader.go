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

func GetTraderTypeFromString(input string) (TraderType, error) {
	traderType := TraderType(input)

	switch traderType {
	case SUPERMARKET, CARDEALER, PHARMACY, GROCERY, GAS_STATON:
		return traderType, nil
	default:
		return "", fmt.Errorf("invalid or unsupported trader type: %s", input)
	}
}

func (t *Trader) RemoveProductId(id string) []string {
	for i, item := range t.ProductsAvailableIDs {
		if item == id {
			return append(t.ProductsAvailableIDs[:i], t.ProductsAvailableIDs[i+1:]...)
		}
	}
	return t.ProductsAvailableIDs
}

func (t *Trader) ContainsProduct(id string) bool {
	isAvailable := false
	for _, productId := range t.ProductsAvailableIDs {
		if productId == id {
			isAvailable = true
			break
		}
	}
	return isAvailable
}
