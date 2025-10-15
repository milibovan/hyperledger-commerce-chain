package main

import (
	"commerce-sdk/client"
	"fmt"
	"log"
	"net/mail"
	"strconv"
	"strings"
	"time"

	fabricclient "github.com/hyperledger/fabric-gateway/pkg/client"

	"google.golang.org/grpc"
)

// Global variables to hold the active connection and gateway
var (
	activeGW   *fabricclient.Gateway
	activeConn *grpc.ClientConn
)

func main() {
	if err := handleMenu(); err != nil {
		log.Fatalf("Application terminated with error: %v", err)
	}
}

func handleMenu() error {
	for {
		if activeGW != nil {
			activeGW.Close()
			activeGW = nil
		}
		if activeConn != nil {
			activeConn.Close()
			activeConn = nil
		}

		fmt.Println("\n--- MAIN MENU ---")
		fmt.Println("1. Connect/Login (Select Org & User)")
		fmt.Println("2. Exit")
		fmt.Print("\nEnter command: ")

		var command int
		_, err := fmt.Scanln(&command)
		if err != nil {
			if err.Error() == "unexpected newline" || strings.Contains(err.Error(), "value is out of range") {
				fmt.Scanln()
				continue
			}
			return fmt.Errorf("error reading command: %w", err)
		}

		switch command {
		case 1:
			if err = connectClient(); err != nil {
				fmt.Printf("Connection failed: %v\n", err)
				continue
			}
			if err = handleChannelAndActionMenu(); err != nil {
				return err
			}
		case 2:
			fmt.Println("Exiting application.")
			return nil
		default:
			fmt.Println("Invalid command. Please try again.")
		}
	}
}

func connectClient() error {
	var orgName, userID string

	for {
		fmt.Println("\nSelect Organization:")
		fmt.Println("1. Org1")
		fmt.Println("2. Org2")
		fmt.Println("3. Org3")
		fmt.Print("Enter option: ")
		var orgNameInput int
		_, err := fmt.Scanln(&orgNameInput)
		if err != nil {
			fmt.Scanln()
			continue
		}

		switch orgNameInput {
		case 1:
			orgName = "org1"
		case 2:
			orgName = "org2"
		case 3:
			orgName = "org3"
		default:
			fmt.Println("Invalid organization option.")
			continue
		}
		break
	}

	for {
		fmt.Println("\nSelect User ID:")
		fmt.Println("1. User1")
		fmt.Println("2. Admin")
		fmt.Println("3. [Create User - Placeholder]")
		fmt.Print("Enter option: ")
		var userIDInput int
		_, err := fmt.Scanln(&userIDInput)
		if err != nil {
			fmt.Scanln()
			continue
		}

		switch userIDInput {
		case 1:
			userID = "User1"
		case 2:
			userID = "Admin"
		case 3:
			// NOTE: Real enrollment logic should go here, but for now, we use a known test user.
			userID = "User1" // Using an existing enrolled identity for simplicity
		default:
			fmt.Println("Invalid user option.")
			continue
		}
		break
	}

	fmt.Printf("\nAttempting to connect as %s from %s...\n", userID, orgName)

	gw, conn, err := client.ConnectGateway(orgName, userID)
	if err != nil {
		return fmt.Errorf("failed to establish connection: %w", err)
	}

	activeGW = gw
	activeConn = conn
	fmt.Println("✅ Successfully connected to Fabric Gateway.")

	return nil
}

func handleChannelAndActionMenu() error {
	var channelName string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Printf("\n--- ACTION MENU (User: %s on Channel: %s) ---\n", activeGW.Identity(), channelName)
		fmt.Println("1. Invoke (Create Merchant, Buy Product, etc.)")
		fmt.Println("2. Query (Read Product, Rich Queries)")
		fmt.Println("0. Disconnect/Logout")
		fmt.Print("Enter command: ")

		var command int
		_, err := fmt.Scanln(&command)
		if err != nil {
			fmt.Println("Error reading command.")
			fmt.Scanln()
			continue
		}

		switch command {
		case 1:
			err = handleInvokeMenu()
			if err != nil {
				return err
			}
		case 2:
			//err = handleCreateUser()
			//if err != nil {
			//	return err
			//}
		case 0:
			fmt.Println("Disconnecting...")
			return nil
		default:
			fmt.Println("Invalid action command.")
		}

	}
}

func handleInvokeMenu() error {

	for {

		fmt.Printf("\n--- INVOKE MENU ---\n")
		fmt.Println("1. Create Trader")
		fmt.Println("2. Create User")
		fmt.Println("3. Create Product")
		fmt.Println("4. Add Product to Trader")
		fmt.Println("5. Buy Product")
		fmt.Println("6. Deposit Money")
		fmt.Println("0. Disconnect/Logout")
		fmt.Print("Enter command: ")

		var command int
		_, err := fmt.Scanln(&command)
		if err != nil {
			fmt.Println("Error reading command.")
			fmt.Scanln()
			continue
		}

		switch command {
		case 1:
			err = handleCreateTrader()
			if err != nil {
				return err
			}
		case 2:
			err = handleCreateUser()
			if err != nil {
				return err
			}
		case 3:
			err = handleCreateProduct()
			if err != nil {
				return err
			}
		case 4:
			err = handleAddProductToTrader()
			if err != nil {
				return err
			}
		case 5:
			err = handleBuyProduct()
			if err != nil {
				return err
			}
		case 6:
			err = handleDepositMoney()
			if err != nil {
				return err
			}
		default:
			fmt.Println("Invalid action command.")
		}
	}
}

func handleCreateTrader() error {
	var channelName, traderType, vat, balance string

	channelName = channelSelectionMenu(channelName)

	traderType = traderTypeMenu(traderType)

	fmt.Print("Enter VAT (PIB): ")
	fmt.Scanln(&vat)

	for {
		fmt.Print("Enter initial balance: ")
		fmt.Scanln(&balance)

		balanceFl, err := strconv.ParseFloat(balance, 64)
		if balanceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for balance. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.CreateTrader(activeGW, channelName, traderType, vat, balance)

	fmt.Printf("\n✅ Trader with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber)

	return nil
}

func handleCreateUser() error {
	var channelName, name, surname, email, balance string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter user's name: ")
	fmt.Scanln(&name)
	fmt.Print("Enter user's surname: ")
	fmt.Scanln(&surname)

	for {
		fmt.Print("Enter email: ")
		fmt.Scanln(&email)
		_, err := mail.ParseAddress(email)
		if err != nil {
			fmt.Println("❌ Invalid input for email. Please valid email.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Print("Enter initial balance: ")
		fmt.Scanln(&balance)

		balanceFl, err := strconv.ParseFloat(balance, 64)
		if balanceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for balance. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.CreateUser(activeGW, channelName, name, surname, email, balance)

	fmt.Printf("\n✅ User with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber)

	return nil
}

func handleCreateProduct() error {
	var channelName, name, expiryDate, price, quantity, traderTypeStr string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)
	for {
		fmt.Println("Enter expiry date (YYYY-MM-DD): ")
		fmt.Scanln(&expiryDate)
		_, err := time.Parse("2006-01-02", expiryDate)
		if err != nil {
			fmt.Println("❌ Invalid input for date. Please enter a date in format YYYY-MM-DD.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter price: ")
		fmt.Scanln(&price)
		priceFl, err := strconv.ParseFloat(price, 64)
		if priceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter quantity: ")
		fmt.Scanln(&quantity)
		quantityInt, err := strconv.Atoi(quantity)
		if quantityInt < 0 || err != nil {
			fmt.Println("❌ Invalid input for quantity. Please enter a positive integer number.")
			fmt.Scanln()
			continue
		}
		break
	}

	traderType := traderTypeMenu(traderTypeStr)

	blockNumber, ID := client.CreateProduct(activeGW, channelName, name, expiryDate, price, quantity, traderType)

	fmt.Printf("\n✅ Product with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber)

	return nil
}

func handleAddProductToTrader() error {
	var channelName, productId, traderId string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Print("Enter product ID: ")
		fmt.Scanln(&productId)
		if productId == "" || !strings.HasPrefix(productId, "PRODUCT_") {
			fmt.Println("❌ Invalid id for product. Please enter a valid id which starts with PRODUCT_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Print("Enter trader ID: ")
		fmt.Scanln(&traderId)
		if traderId == "" || !strings.HasPrefix(traderId, "TRADER_") {
			fmt.Println("❌ Invalid id for trader. Please enter a valid id which starts with TRADER_.")
			fmt.Scanln()
			continue
		}
		break
	}
	blockNumber := client.AddProductToTrader(activeGW, channelName, productId, traderId)

	fmt.Printf("\n✅ Product with ID %s was added successfully to trader %s on channel %s. Block number: %d\n", productId, traderId, channelName, blockNumber)

	return nil
}

func handleBuyProduct() error {
	var channelName, userId, productId, traderId, quantity string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Print("Enter user ID: ")
		fmt.Scanln(&userId)
		if userId == "" || !strings.HasPrefix(userId, "USER_") {
			fmt.Println("❌ Invalid id for user. Please enter a valid id which starts with USER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Print("Enter product ID: ")
		fmt.Scanln(&productId)
		if productId == "" || !strings.HasPrefix(productId, "PRODUCT_") {
			fmt.Println("❌ Invalid id for product. Please enter a valid id which starts with PRODUCT_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Print("Enter trader ID: ")
		fmt.Scanln(&traderId)
		if traderId == "" || !strings.HasPrefix(traderId, "TRADER_") {
			fmt.Println("❌ Invalid id for trader. Please enter a valid id which starts with TRADER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter quantity: ")
		fmt.Scanln(&quantity)
		quantityInt, err := strconv.Atoi(quantity)
		if quantityInt < 0 || err != nil {
			fmt.Println("❌ Invalid input for quantity. Please enter a positive integer number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.BuyProduct(activeGW, channelName, userId, productId, traderId, quantity)

	fmt.Printf("\n✅ Product was bought successfully on channel %s. Block number: %d, Receipt number: %d\n", channelName, blockNumber, ID)

	return nil
}

func handleDepositMoney() error {
	var channelName, userId, amount string
	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Println("Enter network member (user or trader) id: ")
		fmt.Scanln(&userId)
		if userId == "" || !strings.HasPrefix(userId, "USER_") || !strings.HasPrefix(userId, "USER_") {
			fmt.Println("❌ Invalid id for network member. Please enter a valid id which starts with TRADER_ or USER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter amount to deposit: ")
		fmt.Scanln(&amount)
		amountFl, err := strconv.ParseFloat(amount, 64)
		if amountFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for amount. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber := client.DepositMoney(activeGW, channelName, userId, amount)

	fmt.Printf("\n✅ Money was deposited successfully to %s on channel %s. Block number: %d\n", userId, channelName, blockNumber)

	return nil
}

func traderTypeMenu(traderType string) string {
	for {
		fmt.Println("\nSelect trader type:")
		fmt.Println("1. SUPERMARKET")
		fmt.Println("2. CARDEALER")
		fmt.Println("3. PHARMACY")
		fmt.Println("4. GROCERY")
		fmt.Println("5. GAS_STATON")
		fmt.Print("Enter option: ")
		var command int

		_, err := fmt.Scanln(&command)
		if err != nil {
			fmt.Println("❌ Invalid input for trader type. Please enter a number (1-5).")
			fmt.Scanln()
			continue
		}

		switch command {
		case 1:
			traderType = "SUPERMARKET"
		case 2:
			traderType = "CARDEALER"
		case 3:
			traderType = "PHARMACY"
		case 4:
			traderType = "GROCERY"
		case 5:
			traderType = "GAS_STATON"
		default:
			fmt.Println("❌ Invalid trader type option. Please enter a number between 1 and 5.")
			continue
		}

		break
	}
	return traderType
}

func channelSelectionMenu(channelName string) string {
	for {
		fmt.Println("\nSelect Channel:")
		fmt.Println("1. channel-a")
		fmt.Println("2. channel-b")
		fmt.Print("Enter option: ")
		var channelInput int

		_, err := fmt.Scanln(&channelInput)
		if err != nil {
			fmt.Println("❌ Invalid input. Please enter a number (1 or 2).")
			fmt.Scanln()
			continue
		}

		switch channelInput {
		case 1:
			channelName = client.Channel_a
			break
		case 2:
			channelName = client.Channel_b
			break
		default:
			fmt.Println("❌ Invalid channel option. Please enter 1 or 2.")
			continue
		}
		break
	}
	return channelName
}
