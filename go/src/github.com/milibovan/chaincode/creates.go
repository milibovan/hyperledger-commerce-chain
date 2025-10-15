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

func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, id, name, surname, email, balance string) error {
	exists, err := s.AssetExists(ctx, id, "user")
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
		DocType:     "user",
		Id:          id,
		Name:        name,
		Surname:     surname,
		Email:       email,
		ReceiptsIDs: []string{},
		Balance:     balanceFl,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(user.Id, userJSON)
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

	return ctx.GetStub().PutState(trader.Id, traderJSON)
}

func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id, name, expiryDate, price, quantity, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id, "product")
	if err != nil {
		return err
	}

	layout := "2006-01-02 15:04:05"
	expiryDateTime, err := time.Parse(layout, expiryDate)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %w", err)
	}

	priceFl, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return fmt.Errorf("invalid balance format: %w", err)
	}

	quantityInt, err := strconv.Atoi(quantity)

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
		Price:      priceFl,
		ExpiryDate: expiryDateTime,
		Quantity:   quantityInt,
		TraderType: traderType,
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.Id, productJSON)
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

	return id, ctx.GetStub().PutState(receipt.Id, receiptJSON)
}
