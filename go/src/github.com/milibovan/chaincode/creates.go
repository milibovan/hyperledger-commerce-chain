package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, id string, name string, surname string, email string, balance float64) error {
	exists, err := s.AssetExists(ctx, id, "user")
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("User %s already exists", id)
	}

	user := structs.User{
		DocType:     "user",
		Id:          id,
		Name:        name,
		Surname:     surname,
		Email:       email,
		ReceiptsIDs: []string{},
		Balance:     balance,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("USER_"+user.Id, userJSON)
}

func (s *SmartContract) CreateTrader(ctx contractapi.TransactionContextInterface, id, traderTypeStr, vat, balance string) error {
	exists, err := s.AssetExists(ctx, id, "trader")
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
		DocType:              "trader",
		Id:                   id,
		TraderType:           traderType,
		VAT:                  vat,
		ProductsAvailableIDs: []string{},
		ReceiptsIDs:          []string{},
		Balance:              balanceFl,
	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("TRADER_"+trader.Id, traderJSON)
}

func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id string, name string, expiryDate time.Time, price float64, quantity int, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id, "product")
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Product %s already exists", id)
	}
	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	product := structs.Product{
		DocType:    "product",
		Id:         id,
		Name:       name,
		Price:      price,
		ExpiryDate: expiryDate,
		Quantity:   quantity,
		TraderType: traderType,
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("PRODUCT_"+product.Id, productJSON)
}

func (s *SmartContract) CreateReceipt(ctx contractapi.TransactionContextInterface, traderId string, userId string, productIds []string) (string, error) {
	id := uuid.New().String()

	receipt := structs.Receipt{
		DocType:    "receipt",
		Id:         id,
		TraderId:   traderId,
		UserId:     userId,
		ProductIDs: productIds,
		Date:       time.Now(),
	}

	receiptJSON, err := json.Marshal(receipt)
	if err != nil {
		return "", err
	}

	return id, ctx.GetStub().PutState("RECEIPT_"+receipt.Id, receiptJSON)
}
