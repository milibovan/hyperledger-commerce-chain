package structs

import "fmt"

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
	TraderType        TraderType         `json:"trader-type"`
	VAT               string             `json:"vat"`
	ProductsAvailable []ProductInventory `json:"products-available"`
	ReceiptsIDs       []string           `json:"receipts-ids"`
	Balance           float64            `json:"balance"`
	Deleted           bool               `json:"deleted"`
}

type ProductInventory struct {
	ProductId string `json:"product-id"`
	Quantity  int    `json:"quantity"`
}

func GetTraderTypeFromString(input string) (TraderType, error) {
	traderType := TraderType(input)

	switch traderType {
	case SUPERMARKET, CARDEALER, PHARMACY, GROCERY, GAS_STATION:
		return traderType, nil
	default:
		return "", fmt.Errorf("invalid or unsupported trader type: %s", input)
	}
}

func (t *Trader) RemoveProductId(id string) []ProductInventory {
	for i, item := range t.ProductsAvailable {
		if item.ProductId == id {
			return append(t.ProductsAvailable[:i], t.ProductsAvailable[i+1:]...)
		}
	}
	return t.ProductsAvailable
}

func (t *Trader) ContainsProduct(id string) bool {
	isAvailable := false
	for _, item := range t.ProductsAvailable {
		if item.ProductId == id {
			isAvailable = true
			break
		}
	}
	return isAvailable
}

func (t *Trader) UpdateProduct(productId string, quantity int) {
	for i, item := range t.ProductsAvailable {
		if item.ProductId == productId {
			t.ProductsAvailable[i].Quantity += quantity
		}
	}
}
