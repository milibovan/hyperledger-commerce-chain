package main

import (
	"commerce-sdk/client"
	"fmt"
	"strconv"
	"strings"
)

func handleQueryMenu() error {

	for {

		printSubHeader("\n--- QUERY MENU ---\n")
		fmt.Println(Cyan + "1." + Reset + "Get Products by Multiple Categories")
		fmt.Println(Cyan + "2." + Reset + "Get Products by Multiple Categories with Price Range")
		fmt.Println(Cyan + "3." + Reset + "Query Products by Name")
		fmt.Println(Cyan + "4." + Reset + "Query Products by ID")
		fmt.Println(Cyan + "5." + Reset + "Query Products by Trader Type")
		fmt.Println(Cyan + "6." + Reset + "Query Products by Price Range")
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
			printInfo("Returning to main menu...")
			return nil
		default:
			printWarning("Invalid action command.")
		}
	}
}

func handleGetProductsByMultipleCategories() error {
	var channelName, name, productId, traderTypeStr, price string

	channelName = channelSelectionMenu(channelName)

	fmt.Print(Yellow + "\nEnter product's name: " + Reset)
	fmt.Scanln(&name)

	fmt.Print(Yellow + "\nEnter product ID: " + Reset)
	fmt.Scanln(&productId)

	fmt.Println(Yellow + "\nEnter correct min Price: " + Reset)
	fmt.Scanln(&price)

	traderType := traderTypeMenu(traderTypeStr)

	return client.GetProductsByMultipleCategories(activeGW, channelName, name, productId, traderType, price)
}

func handleGetProductsByMultipleCategoriesPriceRange() error {
	var channelName, name, productId, traderTypeStr, minPrice, maxPrice string

	channelName = channelSelectionMenu(channelName)

	fmt.Print(Yellow + "\nEnter product's name: " + Reset)
	fmt.Scanln(&name)

	fmt.Print(Yellow + "\nEnter product ID: " + Reset)
	fmt.Scanln(&productId)

	fmt.Println(Yellow + "\nEnter correct min Price: " + Reset)
	fmt.Scanln(&minPrice)

	fmt.Println(Yellow + "\nEnter correct max Price: " + Reset)
	fmt.Scanln(&maxPrice)

	traderType := traderTypeMenu(traderTypeStr)

	return client.GetProductsByMultipleCategoriesPriceRange(activeGW, channelName, name, productId, traderType, minPrice, maxPrice)
}

func handleQueryProductsByName() error {
	var channelName, name string

	channelName = channelSelectionMenu(channelName)

	fmt.Print(Yellow + "\nEnter product's name: " + Reset)
	fmt.Scanln(&name)

	return client.QueryProductsByName(activeGW, channelName, name)
}

func handleQueryProductsById() error {
	var channelName, productId string

	channelName = channelSelectionMenu(channelName)

	for {
		fmt.Print(Yellow + "\nEnter product ID: " + Reset)
		fmt.Scanln(&productId)
		if productId == "" || !strings.HasPrefix(productId, "PRODUCT_") {
			printWarning("Invalid id for product. Please enter a valid id which starts with PRODUCT_.")
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
		fmt.Println(Yellow + "\nEnter correct min Price: " + Reset)
		fmt.Scanln(&minPrice)
		minPriceFl, err := strconv.ParseFloat(minPrice, 64)
		if minPriceFl < 0 || err != nil {
			printWarning("Invalid input for min Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	for {
		fmt.Println(Yellow + "\nEnter correct max Price: " + Reset)
		fmt.Scanln(&maxPrice)
		maxPriceFl, err := strconv.ParseFloat(maxPrice, 64)
		if maxPriceFl < 0 || err != nil {
			printWarning("Invalid input for max Price. Please enter a positive number.")
			fmt.Scanln()
			continue
		}
		break
	}

	return client.QueryProductsByPriceRange(activeGW, channelName, minPrice, maxPrice)
}
