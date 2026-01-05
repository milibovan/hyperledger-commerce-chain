package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) DeleteUser(ctx contractapi.TransactionContextInterface, id string) error {
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

	user.Deleted = true

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
func (s *SmartContract) DeleteTrader(ctx contractapi.TransactionContextInterface, id string) error {
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

	trader.Deleted = true

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
func (s *SmartContract) DeleteProduct(ctx contractapi.TransactionContextInterface, id string) error {
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

	product.Deleted = true

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
func (s *SmartContract) DeleteReceipt(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.AssetExists(ctx, id, structs.ReceiptET)
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

	receiptKey, err := ctx.GetStub().CreateCompositeKey("receipt", []string{receipt.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(receiptKey, receiptJSON)
}

func (s *SmartContract) DeleteOrder(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.AssetExists(ctx, id, structs.OrderET)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Order %s doesn't exists", id)
	}
	order, err := s.ReadOrder(ctx, id)
	if err != nil {
		return err
	}

	order.Deleted = true

	orderJSON, err := json.Marshal(order)
	if err != nil {
		return err
	}

	orderKey, err := ctx.GetStub().CreateCompositeKey("order", []string{order.Id})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(orderKey, orderJSON)
}

func (s *SmartContract) DeleteRequest(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.AssetExists(ctx, id, structs.RequestET)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("Request %s doesn't exists", id)
	}
	request, err := s.ReadRequest(ctx, id)
	if err != nil {
		return err
	}

	request.Deleted = true

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
