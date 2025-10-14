package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Users
	users := []structs.User{
		{DocType: "user", Id: "1", Name: "Alice", Surname: "Smith", Email: "alice@example.com", ReceiptsIDs: []string{}, Balance: 1000.0},
		{DocType: "user", Id: "2", Name: "Bob", Surname: "Jones", Email: "bob@example.com", ReceiptsIDs: []string{}, Balance: 500.0},
		{DocType: "user", Id: "3", Name: "Carol", Surname: "Philips", Email: "carol@example.com", ReceiptsIDs: []string{}, Balance: 2000.0},
	}

	for _, user := range users {
		userJSON, err := json.Marshal(user)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState("USER_"+user.Id, userJSON)
		if err != nil {
			return fmt.Errorf("failed to put user in world state %v", err)
		}
	}

	// Products
	products := []structs.Product{
		{DocType: "product", Id: "S1", Name: "Milk 1L", ExpiryDate: time.Date(2025, time.December, 31, 0, 0, 0, 0, time.UTC), Price: 1.25, Quantity: 150, TraderType: structs.SUPERMARKET},
		{DocType: "product", Id: "S2", Name: "White Bread", ExpiryDate: time.Date(2025, time.October, 15, 0, 0, 0, 0, time.UTC), Price: 0.80, Quantity: 200, TraderType: structs.SUPERMARKET},
		{DocType: "product", Id: "S3", Name: "Toilet Paper (4-pack)", ExpiryDate: time.Time{}, Price: 5.50, Quantity: 75, TraderType: structs.SUPERMARKET},

		{DocType: "product", Id: "P4", Name: "Vitamin C 500mg", ExpiryDate: time.Date(2027, time.March, 1, 0, 0, 0, 0, time.UTC), Price: 8.99, Quantity: 30, TraderType: structs.PHARMACY},
		{DocType: "product", Id: "P5", Name: "Pain Relief Tablets", ExpiryDate: time.Date(2026, time.September, 20, 0, 0, 0, 0, time.UTC), Price: 4.50, Quantity: 50, TraderType: structs.PHARMACY},
		{DocType: "product", Id: "P6", Name: "Hand Sanitizer 100ml", ExpiryDate: time.Time{}, Price: 2.10, Quantity: 120, TraderType: structs.PHARMACY},

		{DocType: "product", Id: "G7", Name: "Fresh Tomatoes", ExpiryDate: time.Date(2025, time.October, 14, 0, 0, 0, 0, time.UTC), Price: 2.99, Quantity: 80, TraderType: structs.GROCERY},
		{DocType: "product", Id: "G8", Name: "Local Eggs (10-pack)", ExpiryDate: time.Date(2025, time.October, 25, 0, 0, 0, 0, time.UTC), Price: 3.50, Quantity: 45, TraderType: structs.GROCERY},
		{DocType: "product", Id: "G9", Name: "Bottled Water 1.5L", ExpiryDate: time.Time{}, Price: 0.90, Quantity: 300, TraderType: structs.GROCERY},
	}

	for _, product := range products {
		productJSON, err := json.Marshal(product)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState("PRODUCT_"+product.Id, productJSON)
		if err != nil {
			return fmt.Errorf("Failed to put product in world state %v", err)
		}
	}

	// Traders
	traders := []structs.Trader{
		{DocType: "trader", Id: "1", TraderType: structs.SUPERMARKET, VAT: "123456", ProductsAvailableIDs: []string{"S1", "S2", "S3"}, ReceiptsIDs: []string{}, Balance: 10000.0},
		{DocType: "trader", Id: "2", TraderType: structs.PHARMACY, VAT: "456789", ProductsAvailableIDs: []string{"P4", "P5", "P6"}, ReceiptsIDs: []string{}, Balance: 5000.0},
		{DocType: "trader", Id: "3", TraderType: structs.GROCERY, VAT: "789123", ProductsAvailableIDs: []string{"G7", "G8", "G9"}, ReceiptsIDs: []string{}, Balance: 1000.0},
	}

	for _, trader := range traders {
		traderJSON, err := json.Marshal(trader)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState("TRADER_"+trader.Id, traderJSON)
		if err != nil {
			return fmt.Errorf("failed put trader in world state %v", err)
		}
	}

	return nil
}

func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string, assetType string) (bool, error) {
	var key string
	if assetType == "user" {
		key = "USER_" + id
	} else if assetType == "trader" {
		key = "TRADER_" + id
	} else if assetType == "product" {
		key = "PRODUCT_" + id
	} else {
		return false, fmt.Errorf("unsupported asset type: %s", assetType)
	}

	assetJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

func (s *SmartContract) AddProductToTrader(ctx contractapi.TransactionContextInterface, id string, traderId string) error {
	exists, err := s.AssetExists(ctx, traderId, "trader")
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Trader %s does not exists", traderId)
	}

	exists, err = s.AssetExists(ctx, id, "product")
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Product %s must be created using CreateProduct before adding it to a trader", id)
	}

	trader, err := s.ReadTrader(ctx, traderId)
	if err != nil {
		return err
	}

	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	for _, existingID := range trader.ProductsAvailableIDs {
		if existingID == id {
			return fmt.Errorf("Product %s is already available for Trader %s", id, traderId)
		}
	}

	if product.TraderType != trader.TraderType {
		return fmt.Errorf("Product %s is not a trader for trader %s", id, traderId)
	}

	trader.ProductsAvailableIDs = append(trader.ProductsAvailableIDs, id)

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("TRADER_"+trader.Id, traderJSON)
}

func (s *SmartContract) BuyProduct(ctx contractapi.TransactionContextInterface, userId string, productId string, traderId string, quantity int) error {
	if exists, err := s.AssetExists(ctx, userId, "user"); err != nil || !exists {
		return fmt.Errorf("Asset type user with ID %s does not exist", userId)
	}
	if exists, err := s.AssetExists(ctx, traderId, "trader"); err != nil || !exists {
		return fmt.Errorf("Asset type trader with ID %s does not exist", traderId)
	}
	if exists, err := s.AssetExists(ctx, productId, "product"); err != nil || !exists {
		return fmt.Errorf("Asset type product with ID %s does not exist", productId)
	}

	product, err := s.ReadProduct(ctx, productId)
	if err != nil {
		return err
	}
	user, err := s.ReadUser(ctx, userId)
	if err != nil {
		return err
	}
	trader, err := s.ReadTrader(ctx, traderId)
	if err != nil {
		return err
	}

	if !trader.ContainsProduct(product.Id) {
		return fmt.Errorf("Product %s does not exist, at trader", product.Id)
	}

	if product.Quantity < quantity {
		return fmt.Errorf("Not enough of product %s quantity %d", productId, quantity)
	}

	if user.Balance < product.Price*float64(quantity) {
		return fmt.Errorf("Not enough credits of user %s balance %.2f, needed for transaction %.2f", userId, user.Balance, product.Price*float64(quantity))
	}

	user.Balance -= product.Price * float64(quantity)
	trader.Balance += product.Price * float64(quantity)
	product.Quantity -= quantity

	if product.Quantity == 0 {
		trader.ProductsAvailableIDs = trader.RemoveProductId(product.Id)
	}

	receiptId, err := s.CreateReceipt(ctx, traderId, userId, []string{productId})
	if err != nil {
		return err
	}

	user.ReceiptsIDs = append(user.ReceiptsIDs, receiptId)
	trader.ReceiptsIDs = append(trader.ReceiptsIDs, receiptId)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState("USER_"+userId, userJSON)
	if err != nil {
		return err
	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState("TRADER_"+traderId, traderJSON)
	if err != nil {
		return err
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState("PRODUCT_"+product.Id, productJSON)
	if err != nil {
		return err
	}

	return nil
}

func (s *SmartContract) DepositMoney(ctx contractapi.TransactionContextInterface, id string, amount float64, userType string) error {
	var key string
	if userType == "user" {
		key = "USER_" + id
	} else if userType == "trader" {
		key = "TRADER_" + id
	} else {
		return fmt.Errorf("unsupported user type: %s", userType)
	}

	exists, err := s.AssetExists(ctx, id, userType)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Asset type %s with ID %s does not exist", userType, id)
	}

	if amount <= 0 {
		return fmt.Errorf("deposit amount must be positive")
	}

	if userType == "user" {
		user, err := s.ReadUser(ctx, id)
		if err != nil {
			return err
		}
		user.Balance += amount

		userJSON, err := json.Marshal(user)
		if err != nil {
			return err
		}
		return ctx.GetStub().PutState(key, userJSON)
	}
	trader, err := s.ReadTrader(ctx, id)
	if err != nil {
		return err
	}
	trader.Balance += amount

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, traderJSON)
}
