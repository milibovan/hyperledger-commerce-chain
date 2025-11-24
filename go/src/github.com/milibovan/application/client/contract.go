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

func CreateTrader(gw *fabricClient.Gateway, channel, name, traderType, vat, balance string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("TRADER_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateTrader, ID: %s on channel %s\n", ID, channel)

	_, commit, err := ccContract.SubmitAsync("CreateTrader", fabricClient.WithArguments(ID, name, traderType, vat, balance))
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
	var now = time.Now()
	var ID = fmt.Sprintf("ORDER_%d", now.UnixNano())

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

func QueryProductsById(gw *fabricClient.Gateway, channel, id string) error {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryProductsById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryProductsById", fabricClient.WithArguments(id))
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

func QueryUsersById(gw *fabricClient.Gateway, channel, id string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryUsersById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryUsersById", fabricClient.WithArguments(id))
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No users found matching the criteria")
		return "", nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return formatJSON(resultBytes), nil
}

func QueryTradersById(gw *fabricClient.Gateway, channel, id string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryTradersById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryTradersById", fabricClient.WithArguments(id))
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No traders found matching the criteria")
		return "", nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return formatJSON(resultBytes), nil
}

func QueryReceiptsById(gw *fabricClient.Gateway, channel, id string) (string, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Evaluate Transaction: QueryReceiptsById from %s\n", channel)

	resultBytes, err := ccContract.Evaluate("QueryReceiptsById", fabricClient.WithArguments(id))
	if err != nil {
		return "", err
	}

	if len(resultBytes) == 0 || string(resultBytes) == "[]" || string(resultBytes) == "null" {
		fmt.Println("*** No receipts found matching the criteria")
		return "", nil
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
	return formatJSON(resultBytes), nil
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
func UpdateTrader(gw *fabricClient.Gateway, channel, id, name, vat, traderType string) (uint64, error) {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: UpdateTrader, ID: %s on channel %s\n", id, channel)

	_, commit, err := ccContract.SubmitAsync("UpdateTrader", fabricClient.WithArguments(id, name, vat, traderType))
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
