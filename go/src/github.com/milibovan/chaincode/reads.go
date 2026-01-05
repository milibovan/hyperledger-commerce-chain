package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) ReadTrader(ctx contractapi.TransactionContextInterface, id string) (*structs.Trader, error) {
	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{id})
	if err != nil {
		return nil, err
	}

	traderJSON, err := ctx.GetStub().GetState(traderKey)
	if err != nil {
		return nil, err
	}
	if traderJSON == nil {
		return nil, fmt.Errorf("trader %s does not exists", id)
	}

	var trader *structs.Trader
	err = json.Unmarshal(traderJSON, &trader)
	if err != nil {
		return nil, err
	}
	return trader, nil
}

func (s *SmartContract) ReadUser(ctx contractapi.TransactionContextInterface, id string) (*structs.User, error) {
	userKey, err := ctx.GetStub().CreateCompositeKey("user", []string{id})
	if err != nil {
		return nil, err
	}

	userJSON, err := ctx.GetStub().GetState(userKey)
	if err != nil {
		return nil, err
	}
	if userJSON == nil {
		return nil, fmt.Errorf("user %s does not exists", id)
	}

	var user *structs.User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *SmartContract) ReadProduct(ctx contractapi.TransactionContextInterface, id string) (*structs.Product, error) {
	productKey, err := ctx.GetStub().CreateCompositeKey("product", []string{id})
	if err != nil {
		return nil, err
	}

	productJSON, err := ctx.GetStub().GetState(productKey)
	if err != nil {
		return nil, err
	}
	if productJSON == nil {
		return nil, fmt.Errorf("product %s does not exists", id)
	}

	var product *structs.Product
	err = json.Unmarshal(productJSON, &product)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *SmartContract) ReadReceipt(ctx contractapi.TransactionContextInterface, id string) (*structs.Receipt, error) {
	receiptKey, err := ctx.GetStub().CreateCompositeKey("receipt", []string{id})
	if err != nil {
		return nil, err
	}

	receiptJSON, err := ctx.GetStub().GetState(receiptKey)
	if err != nil {
		return nil, err
	}
	if receiptJSON == nil {
		return nil, fmt.Errorf("receipt %s does not exists", id)
	}

	var receipt *structs.Receipt
	err = json.Unmarshal(receiptJSON, &receipt)
	if err != nil {
		return nil, err
	}
	return receipt, nil
}

func (s *SmartContract) ReadOrder(ctx contractapi.TransactionContextInterface, id string) (*structs.Order, error) {
	orderKey, err := ctx.GetStub().CreateCompositeKey("order", []string{id})
	if err != nil {
		return nil, err
	}

	orderJSON, err := ctx.GetStub().GetState(orderKey)
	if err != nil {
		return nil, err
	}
	if orderJSON == nil {
		return nil, fmt.Errorf("order %s does not exists", id)
	}

	var order *structs.Order
	err = json.Unmarshal(orderJSON, &order)
	if err != nil {
		return nil, err
	}
	return order, nil
}

func (s *SmartContract) ReadRequest(ctx contractapi.TransactionContextInterface, id string) (*structs.ProductsRequest, error) {
	requestKey, err := ctx.GetStub().CreateCompositeKey("request", []string{id})
	if err != nil {
		return nil, err
	}

	requestJSON, err := ctx.GetStub().GetState(requestKey)
	if err != nil {
		return nil, err
	}
	if requestJSON == nil {
		return nil, fmt.Errorf("request %s does not exists", id)
	}

	var request *structs.ProductsRequest
	err = json.Unmarshal(requestJSON, &request)
	if err != nil {
		return nil, err
	}
	return request, nil
}
