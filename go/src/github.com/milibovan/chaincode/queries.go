package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func (s *SmartContract) GetProductsByMultipleCategories(ctx contractapi.TransactionContextInterface, name string, id string, traderType string, price string) ([]*structs.Product, error) {
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
		price, err := strconv.ParseFloat(price, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
		selector["price"] = map[string]float64{"$lte": price}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getQueryResultForQueryString(ctx, queryString)
}

func (s *SmartContract) GetProductsByMultipleCategoriesPriceRange(ctx contractapi.TransactionContextInterface, name string, id string, traderType string, minPrice string, maxPrice string) ([]*structs.Product, error) {
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
		minPrice, err := strconv.ParseFloat(minPrice, 64)

		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}
		maxPrice, err := strconv.ParseFloat(maxPrice, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid price format: %w", err)
		}

		selector["price"] = map[string]float64{"$lte": maxPrice, "$gte": minPrice}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
	}

	queryStringBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}
	queryString := string(queryStringBytes)

	return getQueryResultForQueryString(ctx, queryString)
}

// getQueryResultForQueryString executes the passed in query string.
// The result set is built and returned as a byte array containing the JSON results.
func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*structs.Product, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	return constructProductQueryResponseFromIterator(resultsIterator)
}
