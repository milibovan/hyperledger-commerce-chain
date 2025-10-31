package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) UpdateUser(ctx contractapi.TransactionContextInterface, id, name, surname, email string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("User %s doesn't exists", id)
	}
	user, err := s.ReadUser(ctx, id)
	if err != nil {
		return err
	}

	changed := false

	if user.Name != name {
		user.Name = name
		changed = true
	}
	if user.Surname != surname {
		user.Surname = surname
		changed = true
	}
	if user.Email != email {
		user.Email = email
		changed = true
	}

	if !changed {
		return fmt.Errorf("No changes have been made")
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(user.Id, userJSON)
}
func (s *SmartContract) UpdateTrader(ctx contractapi.TransactionContextInterface, id, name, vat, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Trader %s doesn't exists", id)
	}
	trader, err := s.ReadTrader(ctx, id)
	if err != nil {
		return err
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	changed := false

	if trader.Name != name {
		trader.Name = name
		changed = true
	} else if trader.VAT != vat {
		trader.VAT = vat
		changed = true
	} else if trader.TraderType != traderType {
		trader.TraderType = traderType
		changed = true
	}

	if !changed {
		return fmt.Errorf("No changes have been made")
	}

	traderJSON, err := json.Marshal(trader)
	fmt.Println(traderJSON)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(trader.Id, traderJSON)
}
func (s *SmartContract) UpdateProduct(ctx contractapi.TransactionContextInterface, id, name, expiryDateStr, priceStr, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Product %s doesn't exists", id)
	}
	product, err := s.ReadProduct(ctx, id)
	if err != nil {
		return err
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return err
	}

	layout := "2006-01-02 15:04:05"
	expiryDateTime, err := time.Parse(layout, expiryDateStr)
	fmt.Println(expiryDateTime)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %w", err)
	}

	changed := false

	if product.Name != name {
		product.Name = name
		changed = true
	} else if product.ExpiryDate != expiryDateTime {
		product.ExpiryDate = expiryDateTime
		changed = true
	} else if product.Price != price {
		product.Price = price
		changed = true
	} else if product.TraderType != traderType {
		product.TraderType = traderType
		changed = true
	}

	if !changed {
		return fmt.Errorf("No changes have been made")
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.Id, productJSON)
}
