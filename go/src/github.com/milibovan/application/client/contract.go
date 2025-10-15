package client

import (
	"fmt"
	"strings"
	"time"

	fabricClient "github.com/hyperledger/fabric-gateway/pkg/client"
)

func CreateTrader(gw *fabricClient.Gateway, channel, traderType, vat, balance string) (uint64, string) {
	var now = time.Now()
	var ID = fmt.Sprintf("TRADER_%d", now.UnixNano())

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: CreateTrader, ID: %s on channel %s\n", ID, channel)

	_, commit, err := ccContract.SubmitAsync("CreateTrader", fabricClient.WithArguments(ID, traderType, vat, balance))
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

func AddProductToTrader(gw *fabricClient.Gateway, channel, id, traderId string) uint64 {
	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: AddProductToTrader, ID: %s on channel %s, tradedId: %s\n", id, channel, traderId)

	_, commit, err := ccContract.SubmitAsync("AddProductToTrader", fabricClient.WithArguments(id, traderId))
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

	fmt.Println("\n*** AddProductToTrader committed successfully")

	return status.BlockNumber
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

func DepositMoney(gw *fabricClient.Gateway, channel, id, amount string) uint64 {
	var userType string

	if strings.HasPrefix(id, "USER_") {
		userType = "user"
	} else if strings.HasPrefix(id, "TRADER_") {
		userType = "trader"
	} else {
		panic("ID prefix not recognized")
	}

	net := gw.GetNetwork(channel)
	ccContract := net.GetContract(ChaincodeName)

	fmt.Printf("\n--> Submit transaction: DepositMoney, ID: %s on channel %s, amount: %s\n", id, channel, amount)

	_, commit, err := ccContract.SubmitAsync("DepositMoney", fabricClient.WithArguments(id, amount, userType))
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

	fmt.Println("\n*** DepositMoney committed successfully")

	return status.BlockNumber
}
