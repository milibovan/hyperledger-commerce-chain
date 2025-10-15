package client

import (
	"fmt"
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
