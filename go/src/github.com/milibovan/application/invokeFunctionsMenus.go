package main

import (
	"commerce-sdk/client"
	"fmt"
	"net/mail"
	"strconv"
	"strings"
	"time"
)

func handleInvokeMenu() error {

	for {

		printSubHeader("\n--- INVOKE MENU ---\n")
		fmt.Println(Cyan + "1." + Reset + "Create Trader")
		fmt.Println(Cyan + "2." + Reset + "Create User")
		fmt.Println(Cyan + "3." + Reset + "Create Product")
		fmt.Println(Cyan + "4." + Reset + "Add Product to Trader")
		fmt.Println(Cyan + "5." + Reset + "Buy Product")
		fmt.Println(Cyan + "6." + Reset + "Deposit Money")
		fmt.Println(Cyan + "0." + Reset + "Back to Main Menu")
		fmt.Print(Yellow + "\nEnter command: " + Reset)

		var command int
		_, err := fmt.Scanln(&command)
		if err != nil {
			printWarning("Error reading command.")
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
		case 0:
			printInfo("Returning to main menu...")
			return nil
		default:
			printWarning("Invalid action command.")
		}
	}
}

func handleCreateTrader() error {
	var channelName, traderType, vat, balance string

	channelName = channelSelectionMenu(channelName)

	traderType = traderTypeMenu(traderType)

	fmt.Println(Yellow + "\nEnter VAT (PIB): " + Reset)
	fmt.Scanln(&vat)

	for {
		fmt.Println(Yellow + "\nEnter initial balance: " + Reset)
		fmt.Scanln(&balance)

		balanceFl, err := strconv.ParseFloat(balance, 64)
		if balanceFl < 0 || err != nil {
			printWarning("Invalid input for balance. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.CreateTrader(activeGW, channelName, traderType, vat, balance)

	printInfo(fmt.Sprintf("\nTrader with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))

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
			printWarning("Invalid input for email. Please valid email.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter initial balance: " + Reset)
		fmt.Scanln(&balance)

		balanceFl, err := strconv.ParseFloat(balance, 64)
		if balanceFl < 0 || err != nil {
			printWarning("Invalid input for balance. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.CreateUser(activeGW, channelName, name, surname, email, balance)

	printInfo(fmt.Sprintf("\nUser with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))

	return nil
}

func handleCreateProduct() error {
	var channelName, name, expiryDate, price, quantity, traderTypeStr string

	channelName = channelSelectionMenu(channelName)

	fmt.Print(Yellow + "\nEnter product's name: " + Reset)
	fmt.Scanln(&name)
	for {
		fmt.Println(Yellow + "\nEnter expiry date (YYYY-MM-DD): " + Reset)
		fmt.Scanln(&expiryDate)
		_, err := time.Parse("2006-01-02", expiryDate)
		if err != nil {
			printWarning("Invalid input for date. Please enter a date in format YYYY-MM-DD.")
			fmt.Scanln()
			continue
		}
		expiryDate = expiryDate + time.Now().UTC().Format(" 15:04:05")
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter price: " + Reset)
		fmt.Scanln(&price)
		priceFl, err := strconv.ParseFloat(price, 64)
		if priceFl < 0 || err != nil {
			printWarning("Invalid input for price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter quantity: " + Reset)
		fmt.Scanln(&quantity)
		quantityInt, err := strconv.Atoi(quantity)
		if quantityInt < 0 || err != nil {
			printWarning("Invalid input for quantity. Please enter a positive integer number.")
			fmt.Scanln()
			continue
		}
		break
	}

	traderType := traderTypeMenu(traderTypeStr)

	blockNumber, ID := client.CreateProduct(activeGW, channelName, name, expiryDate, price, quantity, traderType)

	printInfo(fmt.Sprintf("\nProduct with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))

	return nil
}

func handleAddProductToTrader() error {
	var channelName, productId, traderId string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Println(Yellow + "\nEnter product ID: " + Reset)
		fmt.Scanln(&productId)
		if productId == "" || !strings.HasPrefix(productId, "PRODUCT_") {
			printWarning("Invalid id for product. Please enter a valid id which starts with PRODUCT_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter trader ID: " + Reset)
		fmt.Scanln(&traderId)
		if traderId == "" || !strings.HasPrefix(traderId, "TRADER_") {
			printWarning("Invalid id for trader. Please enter a valid id which starts with TRADER_.")
			fmt.Scanln()
			continue
		}
		break
	}
	blockNumber := client.AddProductToTrader(activeGW, channelName, productId, traderId)

	printInfo(fmt.Sprintf("\nProduct with ID %s was added successfully to trader %s on channel %s. Block number: %d\n", productId, traderId, channelName, blockNumber))

	return nil
}

func handleBuyProduct() error {
	var channelName, userId, productId, traderId, quantity string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Println(Yellow + "\nEnter user ID: " + Reset)
		fmt.Scanln(&userId)
		if userId == "" || !strings.HasPrefix(userId, "USER_") {
			printWarning("Invalid id for user. Please enter a valid id which starts with USER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter product ID: " + Reset)
		fmt.Scanln(&productId)
		if productId == "" || !strings.HasPrefix(productId, "PRODUCT_") {
			printWarning("Invalid id for product. Please enter a valid id which starts with PRODUCT_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter trader ID: " + Reset)
		fmt.Scanln(&traderId)
		if traderId == "" || !strings.HasPrefix(traderId, "TRADER_") {
			printWarning("Invalid id for trader. Please enter a valid id which starts with TRADER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter quantity: " + Reset)
		fmt.Scanln(&quantity)
		quantityInt, err := strconv.Atoi(quantity)
		if quantityInt < 0 || err != nil {
			printWarning("Invalid input for quantity. Please enter a positive integer number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber, ID := client.BuyProduct(activeGW, channelName, userId, productId, traderId, quantity)

	printInfo(fmt.Sprintf("\nProduct was bought successfully on channel %s. Block number: %d, Receipt number: %d\n", channelName, blockNumber, ID))

	return nil
}

func handleDepositMoney() error {
	var channelName, userId, amount string
	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Println(Yellow + "\nEnter network member (user or trader) id: " + Reset)
		fmt.Scanln(&userId)
		if userId == "" || !strings.HasPrefix(userId, "USER_") && !strings.HasPrefix(userId, "TRADER_") {
			printWarning("Invalid id for network member. Please enter a valid id which starts with TRADER_ or USER_.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter amount to deposit: " + Reset)
		fmt.Scanln(&amount)
		amountFl, err := strconv.ParseFloat(amount, 64)
		if amountFl < 0 || err != nil {
			printWarning("Invalid input for amount. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	blockNumber := client.DepositMoney(activeGW, channelName, userId, amount)

	printInfo(fmt.Sprintf("\nMoney was deposited successfully to %s on channel %s. Block number: %d\n", userId, channelName, blockNumber))

	return nil
}

func traderTypeMenu(traderType string) string {
	for {
		printSubHeader("\nSelect trader type:")
		fmt.Println(Cyan + "1." + Reset + "SUPERMARKET")
		fmt.Println(Cyan + "2." + Reset + "CARDEALER")
		fmt.Println(Cyan + "3." + Reset + "PHARMACY")
		fmt.Println(Cyan + "4." + Reset + "GROCERY")
		fmt.Println(Cyan + "5." + Reset + "GAS_STATON")
		fmt.Print(Yellow + "\nEnter option: " + Reset)
		var command int

		_, err := fmt.Scanln(&command)
		if err != nil {
			printWarning("Invalid input for trader type. Please enter a number (1-5).")
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
			printWarning("Invalid trader type option. Please enter a number between 1 and 5.")
			continue
		}

		break
	}
	return traderType
}
