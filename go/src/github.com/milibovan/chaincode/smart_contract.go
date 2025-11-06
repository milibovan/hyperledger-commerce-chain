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

type SmartContract struct {
	contractapi.Contract
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Users
	users := []structs.User{
		{DocType: "user", Id: "USER_1", Name: "Alice", Surname: "Smith", Email: "alice@example.com", ReceiptsIDs: []string{}, Balance: 1000.0},
		{DocType: "user", Id: "USER_2", Name: "Bob", Surname: "Jones", Email: "bob@example.com", ReceiptsIDs: []string{}, Balance: 500.0},
		{DocType: "user", Id: "USER_3", Name: "Carol", Surname: "Philips", Email: "carol@example.com", ReceiptsIDs: []string{}, Balance: 2000.0},
	}

	for _, user := range users {
		userJSON, err := json.Marshal(user)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(user.Id, userJSON)
		if err != nil {
			return fmt.Errorf("failed to put user in world state %v", err)
		}
	}

	// Products
	products := []structs.Product{
		{DocType: "product", Id: "PRODUCT_1", Name: "Milk 1L", ExpiryDate: time.Date(2025, time.December, 31, 0, 0, 0, 0, time.UTC), Price: 1.25, Quantity: 150, TraderType: structs.SUPERMARKET},
		{DocType: "product", Id: "PRODUCT_2", Name: "White Bread", ExpiryDate: time.Date(2025, time.October, 15, 0, 0, 0, 0, time.UTC), Price: 0.80, Quantity: 200, TraderType: structs.SUPERMARKET},
		{DocType: "product", Id: "PRODUCT_3", Name: "Toilet Paper (4-pack)", ExpiryDate: time.Time{}, Price: 5.50, Quantity: 75, TraderType: structs.SUPERMARKET},

		{DocType: "product", Id: "PRODUCT_4", Name: "Vitamin C 500mg", ExpiryDate: time.Date(2027, time.March, 1, 0, 0, 0, 0, time.UTC), Price: 8.99, Quantity: 30, TraderType: structs.PHARMACY},
		{DocType: "product", Id: "PRODUCT_5", Name: "Pain Relief Tablets", ExpiryDate: time.Date(2026, time.September, 20, 0, 0, 0, 0, time.UTC), Price: 4.50, Quantity: 50, TraderType: structs.PHARMACY},
		{DocType: "product", Id: "PRODUCT_6", Name: "Hand Sanitizer 100ml", ExpiryDate: time.Time{}, Price: 2.10, Quantity: 120, TraderType: structs.PHARMACY},

		{DocType: "product", Id: "PRODUCT_7", Name: "Fresh Tomatoes", ExpiryDate: time.Date(2025, time.October, 14, 0, 0, 0, 0, time.UTC), Price: 2.99, Quantity: 80, TraderType: structs.GROCERY},
		{DocType: "product", Id: "PRODUCT_8", Name: "Local Eggs (10-pack)", ExpiryDate: time.Date(2025, time.October, 25, 0, 0, 0, 0, time.UTC), Price: 3.50, Quantity: 45, TraderType: structs.GROCERY},
		{DocType: "product", Id: "PRODUCT_9", Name: "Bottled Water 1.5L", ExpiryDate: time.Time{}, Price: 0.90, Quantity: 300, TraderType: structs.GROCERY},
	}

	for _, product := range products {
		productJSON, err := json.Marshal(product)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(product.Id, productJSON)
		if err != nil {
			return fmt.Errorf("Failed to put product in world state %v", err)
		}
	}

	// Traders
	traders := []structs.Trader{
		{
			DocType:    "trader",
			Id:         "TRADER_1",
			Name:       "Supermarket_1",
			TraderType: structs.SUPERMARKET,
			VAT:        "123456",
			ProductsAvailable: []structs.ProductInventory{
				{ProductId: "S1", Quantity: 1},
			},
			ReceiptsIDs: []string{},
			Balance:     10000.0,
			Deleted:     false,
		},
		{
			DocType:    "trader",
			Id:         "TRADER_2",
			Name:       "Pharmacy_2",
			TraderType: structs.PHARMACY,
			VAT:        "456789",
			ProductsAvailable: []structs.ProductInventory{
				{ProductId: "P4", Quantity: 2},
			},
			ReceiptsIDs: []string{},
			Balance:     5000.0,
			Deleted:     false,
		},
		{
			DocType:    "trader",
			Id:         "TRADER_3",
			Name:       "Grocery_3",
			TraderType: structs.GROCERY,
			VAT:        "789123",
			ProductsAvailable: []structs.ProductInventory{
				{ProductId: "G7", Quantity: 3},
			},
			ReceiptsIDs: []string{},
			Balance:     1000.0,
			Deleted:     false,
		},
	}

	for _, trader := range traders {
		traderJSON, err := json.Marshal(trader)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(trader.Id, traderJSON)
		if err != nil {
			return fmt.Errorf("failed put trader in world state %v", err)
		}
	}

	return nil
}

func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

func (s *SmartContract) AddProductsToTrader(ctx contractapi.TransactionContextInterface, ids, traderId, quantities string) error {
	exists, err := s.AssetExists(ctx, traderId)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Trader %s does not exists", traderId)
	}

	for _, id := range ids {
		exists, err = s.AssetExists(ctx, string(id))
		if err != nil {
			return err
		}
		if !exists {
			return fmt.Errorf("Product %s must be created using CreateProduct before adding it to a trader", id)
		}
	}

	var quantitiesInt []int32

	for _, quantity := range quantities {
		quantityInt, err := strconv.Atoi(string(quantity))
		if err != nil {
			return err
		}
		quantitiesInt = append(quantitiesInt, int32(quantityInt))
	}

	trader, err := s.ReadTrader(ctx, traderId)
	if err != nil {
		return err
	}

	var products []*structs.Product

	for _, id := range ids {
		product, err := s.ReadProduct(ctx, string(id))
		if err != nil {
			return err
		}
		products = append(products, product)
	}

	for _, item := range trader.ProductsAvailable {
		if strings.Contains(ids, item.ProductId) {
			return fmt.Errorf("Product %s is already available for Trader %s", item.ProductId, traderId)
		}
	}

	//if product.TraderType != trader.TraderType {
	//	return fmt.Errorf("Product %s trader type %s does not match trader %s type %s", id, product.TraderType, traderId, trader.TraderType)
	//}

	for index, product := range products {
		newAvaliableProduct := structs.ProductInventory{
			product.Id,
			quantitiesInt[index],
		}
		trader.ProductsAvailable = append(trader.ProductsAvailable, newAvaliableProduct)

	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(trader.Id, traderJSON)
}

func (s *SmartContract) BuyProduct(ctx contractapi.TransactionContextInterface, id, userId, productId, traderId, quantity string) error {
	if exists, err := s.AssetExists(ctx, userId); err != nil || !exists {
		return fmt.Errorf("Asset type user with ID %s does not exist", userId)
	}
	if exists, err := s.AssetExists(ctx, traderId); err != nil || !exists {
		return fmt.Errorf("Asset type trader with ID %s does not exist", traderId)
	}
	if exists, err := s.AssetExists(ctx, productId); err != nil || !exists {
		return fmt.Errorf("Asset type product with ID %s does not exist", productId)
	}

	quantityInt, err := strconv.Atoi(quantity)
	if err != nil {
		return err
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

	if product.Quantity < quantityInt {
		return fmt.Errorf("Not enough of product %s, available: %d, requested: %d", productId, product.Quantity, quantityInt)
	}

	if user.Balance < product.Price*float64(quantityInt) {
		return fmt.Errorf("Not enough credits of user %s balance %.2f, needed for transaction %.2f", userId, user.Balance, product.Price*float64(quantityInt))
	}

	user.Balance -= product.Price * float64(quantityInt)
	trader.Balance += product.Price * float64(quantityInt)
	product.Quantity -= quantityInt

	if product.Quantity == 0 {
		trader.ProductsAvailable = trader.RemoveProductId(product.Id)
	}

	receiptId, err := s.CreateReceipt(ctx, id, traderId, userId, []string{productId})
	if err != nil {
		return err
	}

	user.ReceiptsIDs = append(user.ReceiptsIDs, receiptId)
	trader.ReceiptsIDs = append(trader.ReceiptsIDs, receiptId)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(userId, userJSON)
	if err != nil {
		return err
	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(traderId, traderJSON)
	if err != nil {
		return err
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(product.Id, productJSON)
	if err != nil {
		return err
	}

	return nil
}

func (s *SmartContract) DepositMoney(ctx contractapi.TransactionContextInterface, id, amount, userType string) error {
	amountFl, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return err
	}

	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Asset type %s with ID %s does not exist", userType, id)
	}

	if amountFl <= 0 {
		return fmt.Errorf("deposit amount must be positive")
	}

	if userType == "user" {
		user, err := s.ReadUser(ctx, id)
		if err != nil {
			return err
		}
		user.Balance += amountFl

		userJSON, err := json.Marshal(user)
		if err != nil {
			return err
		}
		return ctx.GetStub().PutState(id, userJSON)
	}
	trader, err := s.ReadTrader(ctx, id)
	if err != nil {
		return err
	}
	trader.Balance += amountFl

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, traderJSON)
}

func (s *SmartContract) IncreaseQuantity(ctx contractapi.TransactionContextInterface, id, quantity string) error {
	quantityInt, err := strconv.Atoi(quantity)
	if err != nil {
		return err
	}

	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Asset type with ID %s does not exist", id)
	}

	if quantityInt <= 0 {
		return fmt.Errorf("deposit quantity must be positive")
	}

	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	product.Quantity += quantityInt

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, productJSON)
}
