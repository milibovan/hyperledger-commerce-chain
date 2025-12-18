package client

import (
	"bytes"
	"commerce-sdk/models"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	fabricClient "github.com/hyperledger/fabric-gateway/pkg/client"
)

const (
	Red   = "\033[31m"
	Reset = "\033[0m"
)

func formatJSON(data []byte) string {
	var result bytes.Buffer
	if err := json.Indent(&result, data, "", "  "); err != nil {
		panic(fmt.Errorf("failed to parse JSON: %w", err))
	}
	return result.String()
}

func createId(entity string) string {
	var now = time.Now()
	var ID = fmt.Sprintf("%s_%d", entity, now.UnixNano())
	return ID
}

func unmarshalEntityArray[T any](resultBytes []byte) ([]*T, error) {
	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		return []*T{}, nil
	}

	var entities []*T
	err := json.Unmarshal(resultBytes, &entities)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal entities: %w", err)
	}

	return entities, nil
}

func CreateTrader(gw *fabricClient.Gateway, channel, name, traderType, vat, email, balance string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("TRADER_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateTrader, ID: %s on channel %s\n", ID, channel)

	_, commit, err := ccContract.SubmitAsync("CreateTrader", fabricClient.WithArguments(ID, name, traderType, vat, email, balance))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** CreateTrader committed successfully")

	return status.BlockNumber, ID
}

func CreateUser(gw *fabricClient.Gateway, channel, name, surname, email, balance string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("USER_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateUser, ID: %s on channel %s\n", ID, channel)

	_, commit, err := ccContract.SubmitAsync("CreateUser", fabricClient.WithArguments(ID, name, surname, email, balance))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** CreateUser committed successfully")

	return status.BlockNumber, ID
}

func CreateProduct(gw *fabricClient.Gateway, channel, name, expiryDate, price, quantity, traderTypeStr string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("PRODUCT_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateProduct, ID: %s on channel %s\n", ID, channel)

	//fmt.Printf("%s %s %s %s %s %s", ID, name, expiryDate, price, quantity, traderTypeStr)
	_, commit, err := ccContract.SubmitAsync("CreateProduct", fabricClient.WithArguments(ID, name, expiryDate, price, quantity, traderTypeStr))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** CreateProduct committed successfully")

	return status.BlockNumber, ID
}

func CreateOrder(gw *fabricClient.Gateway, channel string, args []string) (uint64, string) {
	ID := createId("ORDER")

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateOrder, ID: %s on channel %s\n", ID, channel)

	//fmt.Printf("%s %s %s %s %s %s", ID, name, expiryDate, price, quantity, traderTypeStr)
	_, commit, err := ccContract.SubmitAsync("CreateOrder", fabricClient.WithArguments(ID, strings.Join(args, ",")))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** CreateOrder committed successfully")

	return status.BlockNumber, ID
}

func AddProductsToTrader(gw *fabricClient.Gateway, channel string, args []string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: AddProductsToTrader, on channel %s, args: %s\n", channel, args)

	_, commit, err := ccContract.SubmitAsync("AddProductsToTrader", fabricClient.WithArguments(args...))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** AddProductsToTrader committed successfully")

	return status.BlockNumber, nil
}

func BuyProduct(gw *fabricClient.Gateway, channel, userId, productId, traderId, quantity string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("RECEIPT_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: BuyProduct, on channel %s\n", channel)

	_, commit, err := ccContract.SubmitAsync("BuyProduct", fabricClient.WithArguments(ID, userId, productId, traderId, quantity))
	if err != nil {
		panic(fmt.Errorf("failed to submit transaction: %w", err))
	}

	status, err := commit.Status()
	if err != nil {
		panic(fmt.Errorf("failed to get transaction commit status: %w", err))
	}

	if !status.Successful {
		panic(fmt.Errorf("failed to commit transaction with status code %v", status.Code))
	}

	fmt.Println("\n*** BuyProduct committed successfully")

	return status.BlockNumber, ID
}

func DepositMoney(gw *fabricClient.Gateway, channel, id, amount string) (uint64, error) {
	var userType string

	if strings.HasPrefix(id, "USER_") {
		userType = "user"
	} else if strings.HasPrefix(id, "TRADER_") {
		userType = "trader"
	} else {
		return uint64(0), fmt.Errorf("invalid user id: %s", id)
	}

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DepositMoney, ID: %s on channel %s, amount: %s\n", id, channel, amount)

	_, commit, err := ccContract.SubmitAsync("DepositMoney", fabricClient.WithArguments(id, amount, userType))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** DepositMoney committed successfully")

	return status.BlockNumber, nil
}

func GetProductsByMultipleCategories(gw *fabricClient.Gateway, channel, name, id, traderType, price string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetProductsByMultipleCategories from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetProductsByMultipleCategories", fabricClient.WithArguments(name, id, traderType, price))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func GetProductsByMultipleCategoriesPriceRange(gw *fabricClient.Gateway, channel, name, id, traderType, minPrice, maxPrice string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetProductsByMultipleCategoriesPriceRange from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetProductsByMultipleCategoriesPriceRange", fabricClient.WithArguments(name, id, traderType, minPrice, maxPrice))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func QueryProductsByName(gw *fabricClient.Gateway, channel, name string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryProductsByName from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryProductsByName", fabricClient.WithArguments(name))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func GetProductById(gw *fabricClient.Gateway, channel, id string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetProductById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetProductById", fabricClient.WithArguments(id))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func QueryProductsByTraderType(gw *fabricClient.Gateway, channel, traderType string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryProductsByTraderType from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryProductsByTraderType", fabricClient.WithArguments(traderType))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func QueryProductsByPriceRange(gw *fabricClient.Gateway, channel, minPrice, maxPrice string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryProductsByPriceRange from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryProductsByPriceRange", fabricClient.WithArguments(minPrice, maxPrice))
	if err != nil {
		return err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return nil
}

func QueryAllUsers(gw *fabricClient.Gateway, channel string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetAllUsers from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetAllUsers")
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No users found matching the criteria")
		return "", err
	}

	return formatJSON(resultBytes), nil
}

func QueryAllTraders(gw *fabricClient.Gateway, channel string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetAllTraders from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetAllTraders")
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No traders found matching the criteria")
		return "", err
	}

	return formatJSON(resultBytes), nil
}

func QueryAllProducts(gw *fabricClient.Gateway, channel string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetAllProducts from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetAllProducts")
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No products found matching the criteria")
		return "", err
	}

	return formatJSON(resultBytes), nil
}

func QueryAllReceipts(gw *fabricClient.Gateway, channel string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetAllReceipts from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetAllReceipts")
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No receipts found matching the criteria")
		return "", err
	}

	return formatJSON(resultBytes), nil
}

func GetUserById(gw *fabricClient.Gateway, channel, id string) (*models.User, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetUserById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetUserById", fabricClient.WithArguments(id))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}

	var user models.User
	if err = json.Unmarshal(resultBytes, &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &user, nil
}

func GetTraderById(gw *fabricClient.Gateway, channel, id string) (*models.Trader, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetTraderById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetTraderById", fabricClient.WithArguments(id))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}

	var trader models.Trader
	if err = json.Unmarshal(resultBytes, &trader); err != nil {
		return nil, fmt.Errorf("failed to unmarshal trader: %w", err)
	}

	return &trader, nil
}

func GetReceiptById(gw *fabricClient.Gateway, channel, id string) (*models.Receipt, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetReceiptById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetReceiptById", fabricClient.WithArguments(id))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}

	var receipt models.Receipt
	if err := json.Unmarshal(resultBytes, &receipt); err != nil {
		return nil, fmt.Errorf("failed to unmarshal receipt: %w", err)
	}

	return &receipt, nil
}

func GetOrderById(gw *fabricClient.Gateway, channel, id string) (*models.Order, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetOrderById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("GetOrderById", fabricClient.WithArguments(id))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}

	var order models.Order
	if err := json.Unmarshal(resultBytes, &order); err != nil {
		return nil, fmt.Errorf("failed to unmarshal order: %w", err)
	}

	return &order, nil
}

func UpdateUser(gw *fabricClient.Gateway, channel, id, name, surname, email string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: UpdateUser, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("UpdateUser", fabricClient.WithArguments(id, name, surname, email))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** UpdateUser committed successfully")

	return status.BlockNumber, nil
}
func UpdateTrader(gw *fabricClient.Gateway, channel, id, name, vat, email, traderType string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: UpdateTrader, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("UpdateTrader", fabricClient.WithArguments(id, name, vat, email, traderType))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** UpdateTrader committed successfully")

	return status.BlockNumber, nil
}
func UpdateProduct(gw *fabricClient.Gateway, channel, id, name, expiryDate, price, traderType string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: UpdateProduct, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("UpdateProduct", fabricClient.WithArguments(id, name, expiryDate, price, traderType))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** UpdateProduct committed successfully")

	return status.BlockNumber, nil
}
func DeleteUser(gw *fabricClient.Gateway, channel, id string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DeleteUser, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("DeleteUser", fabricClient.WithArguments(id))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** DeleteUser committed successfully")

	return status.BlockNumber, nil
}
func DeleteTrader(gw *fabricClient.Gateway, channel, id string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DeleteTrader, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("DeleteTrader", fabricClient.WithArguments(id))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** DeleteTrader committed successfully")

	return status.BlockNumber, nil
}
func DeleteProduct(gw *fabricClient.Gateway, channel, id string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DeleteProduct, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("DeleteProduct", fabricClient.WithArguments(id))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** DeleteProduct committed successfully")

	return status.BlockNumber, nil
}
func DeleteReceipt(gw *fabricClient.Gateway, channel, id string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DeleteReceipt, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("DeleteReceipt", fabricClient.WithArguments(id))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** DeleteReceipt committed successfully")

	return status.BlockNumber, nil
}

func GetProductsByIds(gw *fabricClient.Gateway, channel string, productsIds []string) ([]*models.Product, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetProductsByIds from %s\n", channel)
	fmt.Printf("Product IDs to query: %v\n", productsIds)

	productsIdsJSON, err := json.Marshal(productsIds)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal product IDs: %w", err)
	}

	resultBytes, err := ccContract.Evaluate("GetProductsByIds", fabricClient.WithArguments(string(productsIdsJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}
	products, err := unmarshalEntityArray[models.Product](resultBytes)
	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		fmt.Println("*** No products found matching the criteria")
	} else {
		fmt.Printf("*** Found %d products\n", len(products))
	}

	return products, nil
}
func GetReceiptsByIds(gw *fabricClient.Gateway, channel string, receiptIds []string) ([]*models.Receipt, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetReceiptsByIds from %s\n", channel)
	fmt.Printf("Receipt IDs to query: %v\n", receiptIds)

	receiptsIdsJSON, err := json.Marshal(receiptIds)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal receipt IDs: %w", err)
	}

	resultBytes, err := ccContract.Evaluate("GetReceiptsByIds", fabricClient.WithArguments(string(receiptsIdsJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}
	receipts, err := unmarshalEntityArray[models.Receipt](resultBytes)
	if err != nil {
		return nil, err
	}

	if len(receipts) == 0 {
		fmt.Println("*** No receipts found matching the criteria")
	} else {
		fmt.Printf("*** Found %d receipts\n", len(receipts))
	}

	return receipts, nil
}
func GetOrdersByIds(gw *fabricClient.Gateway, channel string, ordersIds []string) ([]*models.Order, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: GetOrdersByIds from %s\n", channel)
	fmt.Printf("Order IDs to query: %v\n", ordersIds)

	ordersIdsJSON, err := json.Marshal(ordersIds)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal order IDs: %w", err)
	}

	resultBytes, err := ccContract.Evaluate("GetOrdersByIds", fabricClient.WithArguments(string(ordersIdsJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate transaction: %w", err)
	}
	orders, err := unmarshalEntityArray[models.Order](resultBytes)
	if err != nil {
		return nil, err
	}

	if len(orders) == 0 {
		fmt.Println("*** No orders found matching the criteria")
	} else {
		fmt.Printf("*** Found %d orders\n", len(orders))
	}

	return orders, nil
}

func IncreaseQuantity(gw *fabricClient.Gateway, channel, id, quantity string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: IncreaseQuantity, ID: %s on channel %s, quantity: %s\n", id, channel, quantity)

	_, commit, err := ccContract.SubmitAsync("IncreaseQuantity", fabricClient.WithArguments(id, quantity))
	if err != nil {
		return uint64(0), fmt.Errorf("failed to submit transaction: %w", err)
	}

	status, err := commit.Status()
	if err != nil {
		return uint64(0), fmt.Errorf("failed to get transaction commit status: %w", err)
	}

	if !status.Successful {
		return uint64(0), fmt.Errorf("failed to commit transaction with status code %v", status.Code)
	}

	fmt.Println("\n*** IncreaseQuantity committed successfully")

	return status.BlockNumber, nil
}
