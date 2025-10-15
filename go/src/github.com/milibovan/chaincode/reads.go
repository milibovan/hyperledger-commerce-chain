package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) ReadTrader(ctx contractapi.TransactionContextInterface, id string) (*structs.Trader, error) {
	traderJSON, err := ctx.GetStub().GetState(id)
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
	userJSON, err := ctx.GetStub().GetState(id)
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
	productJSON, err := ctx.GetStub().GetState(id)
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
