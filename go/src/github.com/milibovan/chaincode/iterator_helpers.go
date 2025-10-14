package main

import (
	"chaincode/structs"
	"encoding/json"
	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
)

// constructProductQueryResponseFromIterator constructs a slice of products from the resultsIterator
func constructProductQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*structs.Product, error) {
	var products []*structs.Product
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset structs.Product
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		products = append(products, &asset)
	}

	return products, nil
}

// constructUserQueryResponseFromIterator constructs a slice of users from the resultsIterator
func constructUserQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*structs.User, error) {
	var users []*structs.User
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset structs.User
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		users = append(users, &asset)
	}

	return users, nil
}

// constructTraderQueryResponseFromIterator constructs a slice of traders from the resultsIterator
func constructTraderQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*structs.Trader, error) {
	var traders []*structs.Trader
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset structs.Trader
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		traders = append(traders, &asset)
	}

	return traders, nil
}

// constructReceiptQueryResponseFromIterator constructs a slice of receipts from the resultsIterator
func constructReceiptQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*structs.Receipt, error) {
	var receipts []*structs.Receipt
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset structs.Receipt
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		receipts = append(receipts, &asset)
	}

	return receipts, nil
}
