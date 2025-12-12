package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) GetProductsByMultipleCategories(ctx contractapi.TransactionContextInterface, name, id, traderType, price string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if name != "" {
		selector["name"] = map[string]string{"$eq": name}
	}

	if id != "" {
		selector["id"] = map[string]string{"$eq": id}
	}

	if traderType != "" {
		selector["trader-type"] = map[string]string{"$eq": traderType}
	}

	if price != "" {
		priceFl, err := strconv.ParseFloat(price, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
		selector["price"] = map[string]float64{"$lte": priceFl}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (s *SmartContract) GetProductsByMultipleCategoriesPriceRange(ctx contractapi.TransactionContextInterface, name, id, traderType, minPrice, maxPrice string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if name != "" {
		selector["name"] = map[string]string{"$eq": name}
	}

	if id != "" {
		selector["id"] = map[string]string{"$eq": id}
	}

	if traderType != "" {
		selector["trader-type"] = map[string]string{"$eq": traderType}
	}

	if minPrice != "" && maxPrice != "" {
		minPriceFl, err := strconv.ParseFloat(minPrice, 64)

		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
		maxPriceFl, err := strconv.ParseFloat(maxPrice, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}

		selector["price"] = map[string]float64{"$lte": maxPriceFl, "$gte": minPriceFl}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) QueryProductsByName(ctx contractapi.TransactionContextInterface, name string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if name != "" {
		selector["name"] = map[string]string{"$eq": name}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetProductById(ctx contractapi.TransactionContextInterface, id string) (*structs.Product, error) {
	productKey, err := ctx.GetStub().CreateCompositeKey("product", []string{id})
	if err != nil {
		return nil, err
	}

	productBytes, err := ctx.GetStub().GetState(productKey)
	if err != nil {
		return nil, err
	}
	if productBytes == nil {
		return nil, fmt.Errorf("product %s not found", id)
	}

	var product structs.Product
	err = json.Unmarshal(productBytes, &product)
	return &product, err
}

func (t *SmartContract) QueryProductsByTraderType(ctx contractapi.TransactionContextInterface, traderType string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if traderType != "" {
		selector["trader-type"] = map[string]string{"$eq": traderType}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) QueryProductsByPrice(ctx contractapi.TransactionContextInterface, price string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}
	if price != "" {
		priceFl, err := strconv.ParseFloat(price, 64)

		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}

		selector["price"] = map[string]float64{"$lte": priceFl}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) QueryProductsByPriceRange(ctx contractapi.TransactionContextInterface, minPrice, maxPrice string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if minPrice != "" && maxPrice != "" {
		minPriceFl, err := strconv.ParseFloat(minPrice, 64)

		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
		maxPriceFl, err := strconv.ParseFloat(maxPrice, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}

		selector["price"] = map[string]float64{"$lte": maxPriceFl, "$gte": minPriceFl}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetAllUsers(ctx contractapi.TransactionContextInterface) ([]*structs.User, error) {
	selector := map[string]interface{}{
		"doc-type": "user",
		"deleted":  map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getUserQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetAllTraders(ctx contractapi.TransactionContextInterface) ([]*structs.Trader, error) {
	selector := map[string]interface{}{
		"doc-type": "trader",
		"deleted":  map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getTraderQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetAllReceipts(ctx contractapi.TransactionContextInterface) ([]*structs.Receipt, error) {
	selector := map[string]interface{}{
		"doc-type": "receipt",
		"deleted":  map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getReceiptQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetAllProducts(ctx contractapi.TransactionContextInterface) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
		"deleted":  map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetAllOrders(ctx contractapi.TransactionContextInterface) ([]*structs.Order, error) {
	selector := map[string]interface{}{
		"doc-type": "order",
		"deleted":  map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getOrderQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetProductsByIds(ctx contractapi.TransactionContextInterface, productIdsJSON string) ([]*structs.Product, error) {
	var productIds []string
	err := json.Unmarshal([]byte(productIdsJSON), &productIds)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal product IDs: %w", err)
	}

	selector := map[string]interface{}{
		"doc-type": "product",
		"id": map[string]interface{}{
			"$in": productIds,
		},
		"deleted": map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getProductQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetReceiptsByIds(ctx contractapi.TransactionContextInterface, receiptIdsJSON string) ([]*structs.Receipt, error) {
	var receiptIds []string
	err := json.Unmarshal([]byte(receiptIdsJSON), &receiptIds)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal receipt IDs: %w", err)
	}

	selector := map[string]interface{}{
		"doc-type": "receipt",
		"id": map[string]interface{}{
			"$in": receiptIds,
		},
		"deleted": map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getReceiptQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetOrdersByIds(ctx contractapi.TransactionContextInterface, orderIdsJSON string) ([]*structs.Order, error) {
	var orderIds []string
	err := json.Unmarshal([]byte(orderIdsJSON), &orderIds)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal order IDs: %w", err)
	}

	selector := map[string]interface{}{
		"doc-type": "order",
		"id": map[string]interface{}{
			"$in": orderIds,
		},
		"deleted": map[string]interface{}{"$ne": true},
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getOrderQueryResultForQueryString(ctx, queryString)
}

func (t *SmartContract) GetUserById(ctx contractapi.TransactionContextInterface, id string) (*structs.User, error) {
	userKey, err := ctx.GetStub().CreateCompositeKey("user", []string{id})
	if err != nil {
		return nil, err
	}

	userBytes, err := ctx.GetStub().GetState(userKey)
	if err != nil {
		return nil, err
	}
	if userBytes == nil {
		return nil, fmt.Errorf("user %s not found", id)
	}

	var user structs.User
	err = json.Unmarshal(userBytes, &user)
	return &user, err
}

func (t *SmartContract) GetTraderById(ctx contractapi.TransactionContextInterface, id string) (*structs.Trader, error) {
	traderKey, err := ctx.GetStub().CreateCompositeKey("trader", []string{id})
	if err != nil {
		return nil, err
	}

	traderBytes, err := ctx.GetStub().GetState(traderKey)
	if err != nil {
		return nil, err
	}
	if traderBytes == nil {
		return nil, fmt.Errorf("trader %s not found", id)
	}

	var trader structs.Trader
	err = json.Unmarshal(traderBytes, &trader)
	return &trader, err
}

func (t *SmartContract) GetReceiptById(ctx contractapi.TransactionContextInterface, id string) (*structs.Receipt, error) {
	receiptKey, err := ctx.GetStub().CreateCompositeKey("receipt", []string{id})
	if err != nil {
		return nil, err
	}

	receiptBytes, err := ctx.GetStub().GetState(receiptKey)
	if err != nil {
		return nil, err
	}
	if receiptBytes == nil {
		return nil, fmt.Errorf("receipt %s not found", id)
	}

	var receipt structs.Receipt
	err = json.Unmarshal(receiptBytes, &receipt)
	return &receipt, err
}

func (t *SmartContract) GetOrderById(ctx contractapi.TransactionContextInterface, id string) (*structs.Order, error) {
	orderKey, err := ctx.GetStub().CreateCompositeKey("order", []string{id})
	if err != nil {
		return nil, err
	}

	orderBytes, err := ctx.GetStub().GetState(orderKey)
	if err != nil {
		return nil, err
	}
	if orderBytes == nil {
		return nil, fmt.Errorf("order %s not found", id)
	}

	var order structs.Order
	err = json.Unmarshal(orderBytes, &order)
	return &order, err
}

// getProductQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getProductQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.Product, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructProductQueryResponseFromIterator(resultsIterator)
}

// getUserQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getUserQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.User, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructUserQueryResponseFromIterator(resultsIterator)
}

// getTraderQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getTraderQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.Trader, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructTraderQueryResponseFromIterator(resultsIterator)
}

// getReceiptQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getReceiptQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.Receipt, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructReceiptQueryResponseFromIterator(resultsIterator)
}

// getOrderQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getOrderQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.Order, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructOrderQueryResponseFromIterator(resultsIterator)
}
