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

func (t *SmartContract) QueryProductsById(ctx contractapi.TransactionContextInterface, id string) ([]*structs.Product, error) {
	selector := map[string]interface{}{
		"doc-type": "product",
	}

	if id != "" {
		selector["id"] = map[string]string{"$eq": id}
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

func (t *SmartContract) GetProductsByIds(ctx contractapi.TransactionContextInterface, productIds string) ([]*structs.Product, error) {
	var ids []string
	err := json.Unmarshal([]byte(productIds), &ids)
	if err != nil {
		return nil, fmt.Errorf("invalid product IDs format: %w", err)
	}

	selector := map[string]interface{}{
		"doc-type": "product",
		"id": map[string]interface{}{
			"$in": ids,
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
