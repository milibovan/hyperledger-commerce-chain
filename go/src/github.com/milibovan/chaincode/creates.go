package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// TraderAllocation represents products allocated to a specific trader
type TraderAllocation struct {
	TraderId string
	Products []structs.ProductInventory
}

func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, id, name, surname, email, balance string) error {
	exists, err := s.AssetExists(ctx, id, structs.UserET)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("User %s already exists", id)
	}

	balanceFl, err := strconv.ParseFloat(balance, 64)
	if err != nil {
		return fmt.Errorf("invalid balance format: %w", err)
	}

	user := structs.User{
		DocType:   "user",
		Id:        id,
		Name:      name,
		Surname:   surname,
		Email:     email,
		OrdersIDs: []string{},
		Balance:   balanceFl,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	userKey, err := ctx.GetStub().CreateCompositeKey("user", []string{id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(userKey, userJSON)
}

func (s *SmartContract) CreateTrader(ctx contractapi.TransactionContextInterface, id, name, traderTypeStr, vat, balance string) error {
	exists, err := s.AssetExists(ctx, id, structs.TraderET)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Trader %s already exists", id)
	}

	balanceFl, err := strconv.ParseFloat(balance, 64)
	if err != nil {
		return fmt.Errorf("invalid balance format: %w", err)
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	trader := structs.Trader{
		DocType:           "trader",
		Id:                id,
		Name:              name,
		TraderType:        traderType,
		VAT:               vat,
		ProductsAvailable: []structs.ProductInventory{},
		ReceiptsIDs:       []string{},
		Balance:           balanceFl,
	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(traderKey, traderJSON)
}

func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id, name, expiryDate, price, quantity, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id, structs.ProductET)

	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Product %s already exists", id)
	}

	layout := "2006-01-02 15:04:05"
	expiryDateTime, err := time.Parse(layout, expiryDate)
	fmt.Println(expiryDateTime)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %w", err)
	}

	priceFl, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return fmt.Errorf("invalid price format: %w", err)
	}

	quantityInt, err := strconv.Atoi(quantity)
	if err != nil {
		return fmt.Errorf("invalid quantity format: %w", err)
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	product := structs.Product{
		DocType:    "product",
		Id:         id,
		Name:       name,
		Price:      priceFl,
		ExpiryDate: expiryDateTime,
		Quantity:   quantityInt,
		TraderType: traderType,
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	productKey, err := ctx.GetStub().CreateCompositeKey("product", []string{id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(productKey, productJSON)
}

func (s *SmartContract) CreateOrder(ctx contractapi.TransactionContextInterface, id, args string) (string, error) {
	// Check if order already exists
	exists, err := s.AssetExists(ctx, id, structs.OrderET)
	if err != nil {
		return "", fmt.Errorf("failed to check order existence: %w", err)
	}
	if exists {
		return "", fmt.Errorf("order %s already exists", id)
	}

	// Parse and validate arguments
	products, userId, err := parseOrderArguments(args)
	if err != nil {
		return "", fmt.Errorf("invalid order arguments: %w", err)
	}

	// Validate user exists
	user, err := s.ReadUser(ctx, userId)
	if err != nil {
		return "", fmt.Errorf("failed to read user: %w", err)
	}

	// Find optimal trader allocation and create receipts
	receiptIds, err := s.FindAndCreateOptimalReceipts(ctx, userId, products)
	if err != nil {
		return "", fmt.Errorf("failed to create receipts: %w", err)
	}

	totalCost, err := s.calculateTotalCost(ctx, products)
	if err != nil {
		return "", err
	}

	// Create order
	order := structs.Order{
		DocType:     "order",
		Id:          id,
		UserId:      userId,
		Products:    products,
		ReceiptsIds: receiptIds,
		TotalCost:   totalCost,
		Deleted:     false,
	}

	// Update user's order list
	user.OrdersIDs = append(user.OrdersIDs, id)
	user.Balance -= totalCost

	// Marshal and save both order and user
	orderJSON, err := json.Marshal(order)
	if err != nil {
		return "", fmt.Errorf("failed to marshal order: %w", err)
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return "", fmt.Errorf("failed to marshal user: %w", err)
	}

	orderKey, err := ctx.GetStub().CreateCompositeKey("order", []string{id})
	if err != nil {
		return "", err
	}
	userKey, err := ctx.GetStub().CreateCompositeKey("user", []string{user.Id})
	if err != nil {
		return "", err
	}
	if err = ctx.GetStub().PutState(userKey, userJSON); err != nil {
		return "", fmt.Errorf("failed to save user: %w", err)
	}
	if err = ctx.GetStub().PutState(orderKey, orderJSON); err != nil {
		return "", fmt.Errorf("failed to save order: %w", err)
	}

	return id, nil
}

func (s *SmartContract) CreateReceipt(ctx contractapi.TransactionContextInterface, userId, traderId string, products []structs.ProductInventory) (string, error) {
	// Generate deterministic ID using transaction ID and trader ID
	txID := ctx.GetStub().GetTxID()
	id := fmt.Sprintf("RECEIPT_%s_%s", txID, traderId)

	// Read trader and validate they can fulfill the products
	trader, err := s.ReadTrader(ctx, traderId)
	if err != nil {
		return "", fmt.Errorf("failed to read trader: %w", err)
	}

	// Validate trader has sufficient inventory before creating receipt
	canFulfill, _ := trader.ContainsProductsAndRequestedQuantities(products)
	if !canFulfill {
		return "", fmt.Errorf("trader %s cannot fulfill requested products", traderId)
	}

	totalCost, err := s.calculateTotalCost(ctx, products)
	if err != nil {
		return "", err
	}
	// Create receipt
	receipt := structs.Receipt{
		DocType:   "receipt",
		Id:        id,
		TraderId:  traderId,
		UserId:    userId,
		Products:  products,
		Date:      time.Now().Format(time.RFC3339),
		TotalCost: totalCost,
		Deleted:   false,
	}

	// Update trader: add receipt and deduct inventory
	trader.ReceiptsIDs = append(trader.ReceiptsIDs, id)
	for _, product := range products {
		if err := trader.DeductProduct(product.ProductId, product.Quantity); err != nil {
			return "", fmt.Errorf("failed to deduct product %s: %w", product.ProductId, err)
		}
	}

	// Marshal and save trader
	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return "", fmt.Errorf("failed to marshal trader: %w", err)
	}

	// Marshal and save receipt
	receiptJSON, err := json.Marshal(receipt)
	if err != nil {
		return "", fmt.Errorf("failed to marshal receipt: %w", err)
	}

	receiptKey, err := ctx.GetStub().CreateCompositeKey("receipt", []string{id})
	if err != nil {
		return "", err
	}
	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{trader.Id})
	if err != nil {
		return "", err
	}

	if err = ctx.GetStub().PutState(traderKey, traderJSON); err != nil {
		return "", fmt.Errorf("failed to save trader: %w", err)
	}
	if err = ctx.GetStub().PutState(receiptKey, receiptJSON); err != nil {
		return "", fmt.Errorf("failed to save receipt: %w", err)
	}

	return id, nil
}

// FindAndCreateOptimalReceipts finds the minimum set of traders and creates receipts
func (s *SmartContract) FindAndCreateOptimalReceipts(ctx contractapi.TransactionContextInterface, userId string, products []structs.ProductInventory) ([]string, error) {
	traders, err := s.GetAllTraders(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get traders: %w", err)
	}

	if len(traders) == 0 {
		return nil, fmt.Errorf("no traders available")
	}

	// Find optimal trader allocation
	allocations, err := findOptimalTraderAllocation(traders, products)
	if err != nil {
		return nil, err
	}

	// Create receipts for each allocation
	receiptIds := make([]string, 0, len(allocations))
	for _, allocation := range allocations {
		receiptId, err := s.CreateReceipt(ctx, userId, allocation.TraderId, allocation.Products)
		if err != nil {
			return nil, fmt.Errorf("failed to create receipt for trader %s: %w", allocation.TraderId, err)
		}
		receiptIds = append(receiptIds, receiptId)
	}

	return receiptIds, nil
}

// findOptimalTraderAllocation finds the minimum number of traders to fulfill the order
func findOptimalTraderAllocation(traders []*structs.Trader, products []structs.ProductInventory) ([]TraderAllocation, error) {
	// Strategy 1: Check if a single trader can fulfill entire order
	for _, trader := range traders {
		if canFulfillAll, _ := trader.ContainsProductsAndRequestedQuantities(products); canFulfillAll {
			return []TraderAllocation{{
				TraderId: trader.Id,
				Products: products,
			}}, nil
		}
	}

	// Strategy 2: Greedy algorithm - pick traders that cover most remaining products
	return greedyTraderSelection(traders, products)
}

// greedyTraderSelection uses greedy approach to minimize trader count
// Supports partial fulfillment - splits products across traders if needed
func greedyTraderSelection(traders []*structs.Trader, products []structs.ProductInventory) ([]TraderAllocation, error) {
	remaining := cloneProductInventory(products)
	allocations := []TraderAllocation{}
	maxIterations := len(traders) * len(products) // Prevent infinite loops

	for len(remaining) > 0 && maxIterations > 0 {
		maxIterations--

		bestTrader, bestProducts := findBestTraderForRemainingWithPartial(traders, remaining)

		if bestTrader == nil || len(bestProducts) == 0 {
			return nil, fmt.Errorf("no traders available to fulfill order. Missing products: %v", formatProductList(remaining))
		}

		allocations = append(allocations, TraderAllocation{
			TraderId: bestTrader.Id,
			Products: bestProducts,
		})

		remaining = reduceRemainingQuantities(remaining, bestProducts)
	}

	if len(remaining) > 0 {
		return nil, fmt.Errorf("could not fulfill order after maximum iterations. Missing: %v", formatProductList(remaining))
	}

	return allocations, nil
}

// findBestTraderForRemainingWithPartial finds trader that can provide most value
// Supports partial quantities - trader doesn't need full amount
func findBestTraderForRemainingWithPartial(traders []*structs.Trader, remaining []structs.ProductInventory) (*structs.Trader, []structs.ProductInventory) {
	var bestTrader *structs.Trader
	var bestProducts []structs.ProductInventory
	bestScore := 0

	for _, trader := range traders {
		products, score := trader.GetAvailableProductsPartial(remaining)

		if score > bestScore {
			bestScore = score
			bestTrader = trader
			bestProducts = products
		}
	}

	return bestTrader, bestProducts
}

// reduceRemainingQuantities subtracts fulfilled quantities from remaining
// If a product is fully fulfilled, it's removed from the list
func reduceRemainingQuantities(remaining, fulfilled []structs.ProductInventory) []structs.ProductInventory {
	fulfilledMap := make(map[string]int)
	for _, product := range fulfilled {
		fulfilledMap[product.ProductId] = product.Quantity
	}

	result := make([]structs.ProductInventory, 0, len(remaining))
	for _, product := range remaining {
		fulfilledQty := fulfilledMap[product.ProductId]
		remainingQty := product.Quantity - fulfilledQty

		if remainingQty > 0 {
			result = append(result, structs.ProductInventory{
				ProductId: product.ProductId,
				Quantity:  remainingQty,
			})
		}
	}
	return result
}

// cloneProductInventory creates a deep copy of product inventory slice
func cloneProductInventory(products []structs.ProductInventory) []structs.ProductInventory {
	clone := make([]structs.ProductInventory, len(products))
	copy(clone, products)
	return clone
}

// formatProductList formats product list for error messages
func formatProductList(products []structs.ProductInventory) string {
	parts := make([]string, len(products))
	for i, p := range products {
		parts[i] = fmt.Sprintf("%s(qty:%d)", p.ProductId, p.Quantity)
	}
	return strings.Join(parts, ", ")
}

// parseOrderArguments extracts userId and products from comma-separated args
func parseOrderArguments(args string) ([]structs.ProductInventory, string, error) {
	arguments := strings.Split(args, ",")

	if len(arguments) < 3 || len(arguments)%2 == 0 {
		return nil, "", fmt.Errorf("incorrect number of arguments. Expected: UserID,ProductID1,Quantity1[,ProductID2,Quantity2...]")
	}

	userId := strings.TrimSpace(arguments[0])
	if userId == "" {
		return nil, "", fmt.Errorf("userId cannot be empty")
	}

	products := make([]structs.ProductInventory, 0, (len(arguments)-1)/2)
	seenProducts := make(map[string]bool)

	for i := 1; i < len(arguments); i += 2 {
		productId := strings.TrimSpace(arguments[i])
		quantityStr := strings.TrimSpace(arguments[i+1])

		// Check for duplicate products
		if seenProducts[productId] {
			return nil, "", fmt.Errorf("duplicate product '%s' in order", productId)
		}
		seenProducts[productId] = true

		quantity, err := strconv.Atoi(quantityStr)
		if err != nil {
			return nil, "", fmt.Errorf("invalid quantity '%s' for product '%s': %w", quantityStr, productId, err)
		}
		if quantity <= 0 {
			return nil, "", fmt.Errorf("quantity must be positive for product '%s'", productId)
		}

		products = append(products, structs.ProductInventory{
			ProductId: productId,
			Quantity:  quantity,
		})
	}

	return products, userId, nil
}

// calculateTotalCost calculates total price of products
func (s *SmartContract) calculateTotalCost(ctx contractapi.TransactionContextInterface, products []structs.ProductInventory) (float64, error) {
	totalCost := 0.0
	for _, productItem := range products {
		if productItem.Quantity > 0 {
			product, err := s.ReadProduct(ctx, productItem.ProductId)
			if err != nil {
				return 0.0, fmt.Errorf("There is no product with id %s", productItem.ProductId)
			}
			totalCost += product.Price * float64(productItem.Quantity)
		}
	}
	return totalCost, nil
}
