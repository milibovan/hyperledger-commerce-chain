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
	Email             string             `json:"email"`
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

// ContainsProduct checks if trader has a specific product
func (t *Trader) ContainsProduct(productId string) bool {
	for _, item := range t.ProductsAvailable {
		if item.ProductId == productId {
			return true
		}
	}
	return false
}

// GetProduct returns the product inventory if it exists
func (t *Trader) GetProduct(productId string) (*ProductInventory, bool) {
	for i := range t.ProductsAvailable {
		if t.ProductsAvailable[i].ProductId == productId {
			return &t.ProductsAvailable[i], true
		}
	}
	return nil, false
}

// ContainsProductAndRequestedQuantity checks if trader has product with sufficient quantity
// Returns (hasProduct, availableQuantity)
// If availableQuantity == requestedQuantity, the trader can fully fulfill the request
func (t *Trader) ContainsProductAndRequestedQuantity(product ProductInventory) (bool, int) {
	item, found := t.GetProduct(product.ProductId)
	if !found {
		return false, 0
	}

	if item.Quantity >= product.Quantity {
		return true, product.Quantity // Can fulfill completely
	}

	return true, item.Quantity // Has product but insufficient quantity
}

// GetAvailableProductsPartial returns products this trader can provide (full or partial)
// Returns (products, score) where score represents fulfillment value
// Score = number of distinct products covered + total quantity percentage
func (t *Trader) GetAvailableProductsPartial(requested []ProductInventory) ([]ProductInventory, int) {
	available := make([]ProductInventory, 0, len(requested))
	score := 0

	for _, reqProduct := range requested {
		item, found := t.GetProduct(reqProduct.ProductId)
		if !found || item.Quantity <= 0 {
			continue
		}

		// Take whatever is available (up to requested amount)
		quantityToProvide := reqProduct.Quantity
		if item.Quantity < reqProduct.Quantity {
			quantityToProvide = item.Quantity
		}

		available = append(available, ProductInventory{
			ProductId: reqProduct.ProductId,
			Quantity:  quantityToProvide,
		})

		// Score: +100 per distinct product + quantity provided
		score += 100 + quantityToProvide
	}

	return available, score
}

// ContainsProductsAndRequestedQuantities checks if trader can FULLY fulfill all requested products
// Returns (canFulfillAll, availableProducts)
// Used for validation - ensures trader has complete inventory before creating receipt
func (t *Trader) ContainsProductsAndRequestedQuantities(products []ProductInventory) (bool, []ProductInventory) {
	availableProducts := make([]ProductInventory, 0, len(products))

	for _, product := range products {
		hasProduct, availableQty := t.ContainsProductAndRequestedQuantity(product)

		// Only include if trader has the product with sufficient quantity
		if hasProduct && availableQty >= product.Quantity {
			availableProducts = append(availableProducts, product)
		}
	}

	canFulfillAll := len(availableProducts) == len(products)
	return canFulfillAll, availableProducts
}

// DeductProduct reduces the quantity of a product in trader's inventory
func (t *Trader) DeductProduct(productId string, quantity int) error {
	if quantity <= 0 {
		return fmt.Errorf("quantity to deduct must be positive, got %d", quantity)
	}

	for i := range t.ProductsAvailable {
		if t.ProductsAvailable[i].ProductId == productId {
			if t.ProductsAvailable[i].Quantity < quantity {
				return fmt.Errorf("insufficient quantity for product %s: available=%d, requested=%d",
					productId, t.ProductsAvailable[i].Quantity, quantity)
			}
			t.ProductsAvailable[i].Quantity -= quantity
			return nil
		}
	}

	return fmt.Errorf("product %s not found in trader's inventory", productId)
}

// AddProduct adds quantity to an existing product or creates new product entry
func (t *Trader) AddProduct(productId string, quantity int) error {
	if quantity <= 0 {
		return fmt.Errorf("quantity to add must be positive, got %d", quantity)
	}

	for i := range t.ProductsAvailable {
		if t.ProductsAvailable[i].ProductId == productId {
			t.ProductsAvailable[i].Quantity += quantity
			return nil
		}
	}

	// Product doesn't exist, add it
	t.ProductsAvailable = append(t.ProductsAvailable, ProductInventory{
		ProductId: productId,
		Quantity:  quantity,
	})
	return nil
}
