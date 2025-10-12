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

func (s *SmartContract) Init(ctx contractapi.TransactionContextInterface) error {
	// Users
	users := []structs.User{
		{Id: "1", Name: "Alice", Surname: "Smith", Email: "alice@example.com", ReceiptsIDs: []string{}, Balance: 1000.0},
		{Id: "2", Name: "Bob", Surname: "Jones", Email: "bob@example.com", ReceiptsIDs: []string{}, Balance: 500.0},
		{Id: "3", Name: "Carol", Surname: "Philips", Email: "carol@example.com", ReceiptsIDs: []string{}, Balance: 2000.0},
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
		{Id: "S1", Name: "Milk 1L", ExpiryDate: time.Date(2025, time.December, 31, 0, 0, 0, 0, time.UTC), Price: 1.25, Quantity: 150},
		{Id: "S2", Name: "White Bread", ExpiryDate: time.Date(2025, time.October, 15, 0, 0, 0, 0, time.UTC), Price: 0.80, Quantity: 200},
		{Id: "S3", Name: "Toilet Paper (4-pack)", ExpiryDate: time.Time{}, Price: 5.50, Quantity: 75},

		{Id: "P4", Name: "Vitamin C 500mg", ExpiryDate: time.Date(2027, time.March, 1, 0, 0, 0, 0, time.UTC), Price: 8.99, Quantity: 30},
		{Id: "P5", Name: "Pain Relief Tablets", ExpiryDate: time.Date(2026, time.September, 20, 0, 0, 0, 0, time.UTC), Price: 4.50, Quantity: 50},
		{Id: "P6", Name: "Hand Sanitizer 100ml", ExpiryDate: time.Time{}, Price: 2.10, Quantity: 120},

		{Id: "G7", Name: "Fresh Tomatoes", ExpiryDate: time.Date(2025, time.October, 14, 0, 0, 0, 0, time.UTC), Price: 2.99, Quantity: 80},
		{Id: "G8", Name: "Local Eggs (10-pack)", ExpiryDate: time.Date(2025, time.October, 25, 0, 0, 0, 0, time.UTC), Price: 3.50, Quantity: 45},
		{Id: "G9", Name: "Bottled Water 1.5L", ExpiryDate: time.Time{}, Price: 0.90, Quantity: 300},
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
		{Id: "1", TraderType: structs.SUPERMARKET, VAT: "123456", ProductsAvailableIDs: []string{"S1", "S2", "S3"}, ReceiptsIDs: []string{}, Balance: 10000.0},
		{Id: "2", TraderType: structs.PHARMACY, VAT: "456789", ProductsAvailableIDs: []string{"P4", "P5", "P6"}, ReceiptsIDs: []string{}, Balance: 5000.0},
		{Id: "3", TraderType: structs.GROCERY, VAT: "789123", ProductsAvailableIDs: []string{"G7", "G8", "G9"}, ReceiptsIDs: []string{}, Balance: 1000.0},
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
