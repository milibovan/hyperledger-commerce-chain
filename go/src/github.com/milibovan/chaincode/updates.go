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
	exists, err := s.AssetExists(ctx, id, structs.UserET)
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

	userKey, err := ctx.GetStub().CreateCompositeKey("user", []string{user.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(userKey, userJSON)
}
func (s *SmartContract) UpdateTrader(ctx contractapi.TransactionContextInterface, id, name, vat, email, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id, structs.TraderET)
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
	}

	if trader.Email != email {
		trader.Email = email
		changed = true
	}

	if trader.VAT != vat {
		trader.VAT = vat
		changed = true
	}
	if trader.TraderType != traderType {
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

	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{trader.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(traderKey, traderJSON)
}
func (s *SmartContract) UpdateProduct(ctx contractapi.TransactionContextInterface, id, name, expiryDateStr, priceStr, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id, structs.ProductET)
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
	}
	if product.ExpiryDate != expiryDateTime {
		product.ExpiryDate = expiryDateTime
		changed = true
	}
	if product.Price != price {
		product.Price = price
		changed = true
	}
	if product.TraderType != traderType {
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

	productKey, err := ctx.GetStub().CreateCompositeKey("product", []string{product.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(productKey, productJSON)
}
func (s *SmartContract) UpdateRequest(ctx contractapi.TransactionContextInterface, id, status, orderId, traderId string) error {
	request, err := s.ReadRequest(ctx, id)
	if err != nil {
		return err
	}

	trader, err := s.ReadTrader(ctx, traderId)
	if err != nil {
		return err
	}

	requestStatus, err := structs.GetRequestStatusFromString(status)
	if err != nil {
		return err
	}

	changed := false

	if request.Status != requestStatus {
		request.Status = requestStatus
		changed = true
	}
	if request.OrderId != orderId {
		request.OrderId = orderId
		changed = true
	}
	if request.TraderId != traderId {
		request.TraderId = traderId
		changed = true
	}

	if !changed {
		return fmt.Errorf("No changes have been made")
	}

	trader.RequestsIDs = append(trader.RequestsIDs, request.Id)
	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{trader.Id})
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(traderKey, traderJSON)
	if err != nil {
		return err
	}

	requestJSON, err := json.Marshal(request)
	if err != nil {
		return err
	}

	requestKey, err := ctx.GetStub().CreateCompositeKey("request", []string{request.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(requestKey, requestJSON)
}
