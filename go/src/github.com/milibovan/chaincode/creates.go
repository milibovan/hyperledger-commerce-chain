package main

import (
	"chaincode/structs"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func createId(entity string) string {
	var now = time.Now()
	var ID = fmt.Sprintf("%s_%d", entity, now.UnixNano())
	return ID
}

func (s *SmartContract) CreateUser(ctx contractapi.TransactionContextInterface, id, name, surname, email, balance string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("User %s already exists", id)
	}

	balanceFl, err := strconv.ParseFloat(balance, 64)
	if err != nil {
		return fmt.Errorf("invalid balance format: %w", err)
	}

	user := structs.User{
		DocType:   "user",
		Id:        id,
		Name:      name,
		Surname:   surname,
		Email:     email,
		OrdersIDs: []string{},
		Balance:   balanceFl,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(user.Id, userJSON)
}

func (s *SmartContract) CreateTrader(ctx contractapi.TransactionContextInterface, id, name, traderTypeStr, vat, balance string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Trader %s already exists", id)
	}

	balanceFl, err := strconv.ParseFloat(balance, 64)
	if err != nil {
		return fmt.Errorf("invalid balance format: %w", err)
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	trader := structs.Trader{
		DocType:           "trader",
		Id:                id,
		Name:              name,
		TraderType:        traderType,
		VAT:               vat,
		ProductsAvailable: []structs.ProductInventory{},
		ReceiptsIDs:       []string{},
		Balance:           balanceFl,
	}

	traderJSON, err := json.Marshal(trader)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(trader.Id, traderJSON)
}

func (s *SmartContract) CreateProduct(ctx contractapi.TransactionContextInterface, id, name, expiryDate, price, quantity, traderTypeStr string) error {
	exists, err := s.AssetExists(ctx, id)

	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("Product %s already exists", id)
	}

	layout := "2006-01-02 15:04:05"
	expiryDateTime, err := time.Parse(layout, expiryDate)
	fmt.Println(expiryDateTime)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %w", err)
	}

	priceFl, err := strconv.ParseFloat(price, 64)
	if err != nil {
		return fmt.Errorf("invalid price format: %w", err)
	}

	quantityInt, err := strconv.Atoi(quantity)
	if err != nil {
		return fmt.Errorf("invalid quantity format: %w", err)
	}

	traderType, err := structs.GetTraderTypeFromString(traderTypeStr)
	if err != nil {
		return err
	}

	product := structs.Product{
		DocType:    "product",
		Id:         id,
		Name:       name,
		Price:      priceFl,
		ExpiryDate: expiryDateTime,
		Quantity:   quantityInt,
		TraderType: traderType,
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(product.Id, productJSON)
}

func (s *SmartContract) CreateOrder(ctx contractapi.TransactionContextInterface, id, args string) (string, error) {
	exists, err := s.AssetExists(ctx, id)

	if err != nil {
		return "", err
	}
	if exists {
		return "", fmt.Errorf("Order %s already exists", id)
	}

	if len(args) < 4 || (len(args)-2)%2 != 0 {
		return "", fmt.Errorf("incorrect number of arguments. Expecting UserID, followed by productID/quantity pairs")
	}

	arguments := strings.Split(args, ",")
	userId := arguments[0]

	var products []structs.ProductInventory

	for i := 1; i < len(products); i += 2 {
		productId := arguments[i]
		quantityStr := arguments[i+1]

		quantity, err := strconv.Atoi(quantityStr)
		if err != nil {
			return "", fmt.Errorf("invalid quantity format: %w", err)
		}

		product := structs.ProductInventory{
			ProductId: productId,
			Quantity:  quantity,
		}

		products = append(products, product)
	}

	receiptIds, err := s.FindAndCreateAllReceipts(ctx, userId, products)
	if err != nil {
		return "", err
	}

	order := structs.Order{
		DocType:     "order",
		Id:          id,
		UserId:      userId,
		Products:    products,
		ReceiptsIds: receiptIds,
		Deleted:     false,
	}

	orderJSON, err := json.Marshal(order)
	if err != nil {
		return "", err
	}

	return id, ctx.GetStub().PutState(order.Id, orderJSON)
}

func (s *SmartContract) FindAndCreateAllReceipts(ctx contractapi.TransactionContextInterface, userId string, products []structs.ProductInventory) ([]string, error) {
	traders, err := s.GetAllTraders(ctx)
	var receiptsIds []string

	if err != nil {
		return nil, err
	}

	hasSingleTraderAll, traderId := hasSingleTraderAllProducts(traders, products)

	if !hasSingleTraderAll {
		haveAllProducts, tradersIds := findTradersThatHaveAllProducts(traders, products)
		if haveAllProducts {
			for _, id := range tradersIds {
				var receiptId string
				receiptId, err = s.CreateReceipt(ctx, userId, id, products)
				if err != nil {
					return nil, err
				}

				receiptsIds = append(receiptsIds, receiptId)
			}
		} else {
			return []string{}, fmt.Errorf("There is no traders that can fulfil order")
		}
	} else {
		var receiptId string
		receiptId, err = s.CreateReceipt(ctx, userId, traderId, products)
		if err != nil {
			return nil, err
		}

		receiptsIds = append(receiptsIds, receiptId)
	}

	return receiptsIds, nil
}

func (s *SmartContract) CreateReceipt(ctx contractapi.TransactionContextInterface, userId, traderId string, products []structs.ProductInventory) (string, error) {
	id := createId("RECEIPT")

	receipt := structs.Receipt{
		DocType:  "receipt",
		Id:       id,
		TraderId: traderId,
		UserId:   userId,
		Products: products,
		Date:     time.Now().String(),
		Deleted:  false,
	}

	receiptJSON, err := json.Marshal(receipt)
	if err != nil {
		return "", err
	}

	err = ctx.GetStub().PutState(receipt.Id, receiptJSON)
	if err != nil {
		return "", err
	}
	return id, nil
}

func hasSingleTraderAllProducts(traders []*structs.Trader, products []structs.ProductInventory) (bool, string) {
	for _, trader := range traders {
		containsAllProducts, _ := trader.ContainsProductsAndRequestedQuantities(products)
		if containsAllProducts {
			return true, trader.Id
		}
	}

	return false, ""
}

func findTradersThatHaveAllProducts(traders []*structs.Trader, products []structs.ProductInventory) (bool, []string) {
	var traderIds []string
	for _, trader := range traders {
		_, availableProducts := trader.ContainsProductsAndRequestedQuantities(products)
		products = removeItems(products, availableProducts)
		traderIds = append(traderIds, trader.Id)
		if len(products) == 0 {
			return true, traderIds
		}
	}
	return false, traderIds
}

func removeItems(mainSlice, itemsToRemove []structs.ProductInventory) []structs.ProductInventory {
	removeMap := make(map[string]bool)
	for _, item := range itemsToRemove {
		removeMap[item.ProductId] = true
	}

	var result []structs.ProductInventory
	for _, item := range mainSlice {
		if !removeMap[item.ProductId] {
			result = append(result, item)
		}
	}
	return result
}
