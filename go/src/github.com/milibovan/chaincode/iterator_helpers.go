package main

import (
	"chaincode/structs"
	"encoding/json"
	"time"

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

// constructOrderQueryResponseFromIterator constructs a slice of orders from the resultsIterator
func constructOrderQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*structs.Order, error) {
	var orders []*structs.Order
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset structs.Order
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		orders = append(orders, &asset)
	}

	return orders, nil
}

// HistoryProductQueryResult structure used for returning result of history query
type HistoryProductQueryResult struct {
	Record    *structs.Product `json:"record"`
	TxId      string           `json:"tx-id"`
	Timestamp time.Time        `json:"timestamp"`
	IsDelete  bool             `json:"is-delete"`
}

// PaginatedProductQueryResult structure used for returning paginated query results and metadata
type PaginatedProductQueryResult struct {
	Records             []*structs.Product `json:"records"`
	FetchedRecordsCount int32              `json:"fetched-records-count"`
	Bookmark            string             `json:"bookmark"`
}

// HistoryUserQueryResult structure used for returning result of history query
type HistoryUserQueryResult struct {
	Record    *structs.User `json:"record"`
	TxId      string        `json:"tx-id"`
	Timestamp time.Time     `json:"timestamp"`
	IsDelete  bool          `json:"is-delete"`
}

// PaginatedUserQueryResult structure used for returning paginated query results and metadata
type PaginatedUserQueryResult struct {
	Records             []*structs.User `json:"records"`
	FetchedRecordsCount int32           `json:"fetched-records-count"`
	Bookmark            string          `json:"bookmark"`
}

// HistoryTraderQueryResult structure used for returning result of history query
type HistoryTraderQueryResult struct {
	Record    *structs.Trader `json:"record"`
	TxId      string          `json:"tx-id"`
	Timestamp time.Time       `json:"timestamp"`
	IsDelete  bool            `json:"is-delete"`
}

// PaginatedTraderQueryResult structure used for returning paginated query results and metadata
type PaginatedTraderQueryResult struct {
	Records             []*structs.Trader `json:"records"`
	FetchedRecordsCount int32             `json:"fetched-records-count"`
	Bookmark            string            `json:"bookmark"`
}

// HistoryReceiptQueryResult structure used for returning result of history query
type HistoryReceiptQueryResult struct {
	Record    *structs.Receipt `json:"record"`
	TxId      string           `json:"tx-id"`
	Timestamp time.Time        `json:"timestamp"`
	IsDelete  bool             `json:"is-delete"`
}

// PaginatedReceiptQueryResult structure used for returning paginated query results and metadata
type PaginatedReceiptQueryResult struct {
	Records             []*structs.Receipt `json:"records"`
	FetchedRecordsCount int32              `json:"fetched-records-count"`
	Bookmark            string             `json:"bookmark"`
}

// HistoryOrderQueryResult structure used for returning result of history query
type HistoryOrderQueryResult struct {
	Record    *structs.Order `json:"record"`
	TxId      string         `json:"tx-id"`
	Timestamp time.Time      `json:"timestamp"`
	IsDelete  bool           `json:"is-delete"`
}

// PaginatedOrderQueryResult structure used for returning paginated query results and metadata
type PaginatedOrderQueryResult struct {
	Records             []*structs.Order `json:"records"`
	FetchedRecordsCount int32            `json:"fetched-records-count"`
	Bookmark            string           `json:"bookmark"`
}
