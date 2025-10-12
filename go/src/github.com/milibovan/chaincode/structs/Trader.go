package structs

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
	TraderType           TraderType `json:"traderType"`
	VAT                  string     `json:"vat"`
	ProductsAvailableIDs []string   `json:"products-available-ids"`
	ReceiptsIDs          []string   `json:"receipts-ids"`
	Balance              float64    `json:"balance"`
}
