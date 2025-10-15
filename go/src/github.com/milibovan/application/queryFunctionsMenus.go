package main

import (
	"commerce-sdk/client"
	"fmt"
	"strconv"
	"strings"
)

func handleQueryMenu() error {

	for {

		fmt.Printf("\n--- QUERY MENU ---\n")
		fmt.Println("1. Get Products by Multiple Categories")
		fmt.Println("2. Create User")
		fmt.Println("3. Create Product")
		fmt.Println("4. Add Product to Trader")
		fmt.Println("5. Buy Product")
		fmt.Println("6. Deposit Money")
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
			handleGetProductsByMultipleCategories()
		case 2:
			handleGetProductsByMultipleCategoriesPriceRange()
		case 3:
			handleQueryProductsByName()
		case 4:
			handleQueryProductsById()
		case 5:
			handleQueryProductsByTraderType()
		case 6:
			handleQueryProductsByPriceRange()
		default:
			fmt.Println("Invalid action command.")
		}
	}
}

func handleGetProductsByMultipleCategories() {
	var channelName, name, productId, traderTypeStr, price string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

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
		fmt.Println("Enter correct price: ")
		fmt.Scanln(&price)
		priceFl, err := strconv.ParseFloat(price, 64)
		if priceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	traderType := traderTypeMenu(traderTypeStr)

	client.GetProductsByMultipleCategories(activeGW, channelName, name, productId, traderType, price)
}

func handleGetProductsByMultipleCategoriesPriceRange() {
	var channelName, name, productId, traderTypeStr, minPrice, maxPrice string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

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
		fmt.Println("Enter correct min Price: ")
		fmt.Scanln(&minPrice)
		minPriceFl, err := strconv.ParseFloat(minPrice, 64)
		if minPriceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for min Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter correct max Price: ")
		fmt.Scanln(&maxPrice)
		maxPriceFl, err := strconv.ParseFloat(maxPrice, 64)
		if maxPriceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for max Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	traderType := traderTypeMenu(traderTypeStr)

	client.GetProductsByMultipleCategoriesPriceRange(activeGW, channelName, name, productId, traderType, minPrice, maxPrice)
}

func handleQueryProductsByName() {
	var channelName, name string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

	client.QueryProductsByName(activeGW, channelName, name)
}

func handleQueryProductsById() {
	var channelName, productId string

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

	client.QueryProductsById(activeGW, channelName, productId)
}

func handleQueryProductsByTraderType() {
	var channelName, traderTypeStr string

	channelName = channelSelectionMenu(channelName)

	traderType := traderTypeMenu(traderTypeStr)

	client.QueryProductsByTraderType(activeGW, channelName, traderType)
}

func handleQueryProductsByPriceRange() {
	var channelName, minPrice, maxPrice string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Println("Enter correct min Price: ")
		fmt.Scanln(&minPrice)
		minPriceFl, err := strconv.ParseFloat(minPrice, 64)
		if minPriceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for min Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println("Enter correct max Price: ")
		fmt.Scanln(&maxPrice)
		maxPriceFl, err := strconv.ParseFloat(maxPrice, 64)
		if maxPriceFl < 0 || err != nil {
			fmt.Println("❌ Invalid input for max Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	client.QueryProductsByPriceRange(activeGW, channelName, minPrice, maxPrice)
}
