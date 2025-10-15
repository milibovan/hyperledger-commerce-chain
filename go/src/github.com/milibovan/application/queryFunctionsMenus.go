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
		fmt.Println("2. Get Products by Multiple Categories with Price Range")
		fmt.Println("3. Query Products by Name")
		fmt.Println("4. Query Products by ID")
		fmt.Println("5. Query Products by Trader Type")
		fmt.Println("6. Query Products by Price Range")
		fmt.Println("0. Back to Main Menu")
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
			err = handleGetProductsByMultipleCategories()
			if err != nil {
				return err
			}
		case 2:
			err = handleGetProductsByMultipleCategoriesPriceRange()
			if err != nil {
				return err
			}
		case 3:
			err = handleQueryProductsByName()
			if err != nil {
				return err
			}
		case 4:
			err = handleQueryProductsById()
			if err != nil {
				return err
			}
		case 5:
			err = handleQueryProductsByTraderType()
			if err != nil {
				return err
			}
		case 6:
			err = handleQueryProductsByPriceRange()
			if err != nil {
				return err
			}
		case 0:
			fmt.Println("Returning to main menu...")
			return nil
		default:
			fmt.Println("Invalid action command.")
		}
	}
}

func handleGetProductsByMultipleCategories() error {
	var channelName, name, productId, traderTypeStr, price string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

	fmt.Print("Enter product ID: ")
	fmt.Scanln(&productId)

	fmt.Println("Enter correct min Price: ")
	fmt.Scanln(&price)

	traderType := traderTypeMenu(traderTypeStr)

	return client.GetProductsByMultipleCategories(activeGW, channelName, name, productId, traderType, price)
}

func handleGetProductsByMultipleCategoriesPriceRange() error {
	var channelName, name, productId, traderTypeStr, minPrice, maxPrice string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

	fmt.Print("Enter product ID: ")
	fmt.Scanln(&productId)

	fmt.Println("Enter correct min Price: ")
	fmt.Scanln(&minPrice)

	fmt.Println("Enter correct max Price: ")
	fmt.Scanln(&maxPrice)

	traderType := traderTypeMenu(traderTypeStr)

	return client.GetProductsByMultipleCategoriesPriceRange(activeGW, channelName, name, productId, traderType, minPrice, maxPrice)
}

func handleQueryProductsByName() error {
	var channelName, name string

	channelName = channelSelectionMenu(channelName)

	fmt.Print("Enter product's name: ")
	fmt.Scanln(&name)

	return client.QueryProductsByName(activeGW, channelName, name)
}

func handleQueryProductsById() error {
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

	return client.QueryProductsById(activeGW, channelName, productId)
}

func handleQueryProductsByTraderType() error {
	var channelName, traderTypeStr string

	channelName = channelSelectionMenu(channelName)

	traderType := traderTypeMenu(traderTypeStr)

	return client.QueryProductsByTraderType(activeGW, channelName, traderType)
}

func handleQueryProductsByPriceRange() error {
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

	return client.QueryProductsByPriceRange(activeGW, channelName, minPrice, maxPrice)
}
