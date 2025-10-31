package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) DeleteUser(ctx contractapi.TransactionContextInterface, id string) error {
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

	user.Deleted = true

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(user.Id, userJSON)
}
func (s *SmartContract) DeleteTrader(ctx contractapi.TransactionContextInterface, id string) error {
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

	trader.Deleted = true

	traderJSON, err := json.Marshal(trader)
	fmt.Println(traderJSON)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(trader.Id, traderJSON)
}
func (s *SmartContract) DeleteProduct(ctx contractapi.TransactionContextInterface, id string) error {
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

	product.Deleted = true

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.Id, productJSON)
}
func (s *SmartContract) DeleteReceipt(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Receipt %s doesn't exists", id)
	}
	receipt, err := s.ReadReceipt(ctx, id)
	if err != nil {
		return err
	}

	receipt.Deleted = true

	receiptJSON, err := json.Marshal(receipt)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(receipt.Id, receiptJSON)
}
