package main

import (
	"commerce-sdk/client"
	"flag"
	"fmt"
	"log"
	"os"
)

func handleCLI() {
	if len(os.Args) < 2 {
		printCLIHelp()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "create-trader":
		createTraderCmd := flag.NewFlagSet("create-trader", flag.ExitOnError)
		// Add global flags to THIS command's flagset
		org := createTraderCmd.String("org", "org1", "Organization (org1, org2, org3)")
		user := createTraderCmd.String("user", "User1", "User identity (User1, Admin)")
		channel := createTraderCmd.String("channel", "channel-a", "Channel name (channel-a, channel-b)")
		// Command-specific flags
		traderType := createTraderCmd.String("type", "SUPERMARKET", "Trader type")
		vat := createTraderCmd.String("vat", "123456789", "VAT number")
		balance := createTraderCmd.String("balance", "10000", "Initial balance")

		createTraderCmd.Parse(os.Args[2:])
		executeCLI(*org, *user, *channel, func() {
			handleCLICreateTrader(*channel, *traderType, *vat, *balance)
		})

	case "create-user":
		createUserCmd := flag.NewFlagSet("create-user", flag.ExitOnError)
		org := createUserCmd.String("org", "org1", "Organization")
		user := createUserCmd.String("user", "User1", "User identity")
		channel := createUserCmd.String("channel", "channel-a", "Channel name")
		name := createUserCmd.String("name", "John", "User name")
		surname := createUserCmd.String("surname", "Doe", "User surname")
		email := createUserCmd.String("email", "john@example.com", "User email")
		balance := createUserCmd.String("balance", "1000", "Initial balance")

		createUserCmd.Parse(os.Args[2:])
		executeCLI(*org, *user, *channel, func() {
			handleCLICreateUser(*channel, *name, *surname, *email, *balance)
		})

	case "create-product":
		createProductCmd := flag.NewFlagSet("create-product", flag.ExitOnError)
		org := createProductCmd.String("org", "org1", "Organization")
		user := createProductCmd.String("user", "User1", "User identity")
		channel := createProductCmd.String("channel", "channel-a", "Channel name")
		name := createProductCmd.String("name", "Product", "Product name")
		expiryDate := createProductCmd.String("expiry", "2025-12-31 15:45:03", "Expiry date (YYYY-MM-DD)")
		price := createProductCmd.String("price", "10.0", "Product price")
		quantity := createProductCmd.String("quantity", "100", "Product quantity")
		traderType := createProductCmd.String("type", "SUPERMARKET", "Trader type")

		createProductCmd.Parse(os.Args[2:])
		expiryDateTime := *expiryDate
		err := executeCLI(*org, *user, *channel, func() {
			handleCLICreateProduct(*channel, *name, expiryDateTime, *price, *quantity, *traderType)
		})
		if err != nil {
			fmt.Errorf(err.Error())
		}

	case "add-product-to-trader":
		addProductCmd := flag.NewFlagSet("add-product-to-trader", flag.ExitOnError)
		org := addProductCmd.String("org", "org1", "Organization")
		user := addProductCmd.String("user", "User1", "User identity")
		channel := addProductCmd.String("channel", "channel-a", "Channel name")
		productId := addProductCmd.String("product-id", "", "Product ID")
		traderId := addProductCmd.String("trader-id", "", "Trader ID")

		addProductCmd.Parse(os.Args[2:])
		if *productId == "" || *traderId == "" {
			log.Fatal("Both --product-id and --trader-id are required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIAddProductToTrader(*channel, *productId, *traderId)
		})

	case "buy-product":
		buyProductCmd := flag.NewFlagSet("buy-product", flag.ExitOnError)
		org := buyProductCmd.String("org", "org1", "Organization")
		user := buyProductCmd.String("user", "User1", "User identity")
		channel := buyProductCmd.String("channel", "channel-a", "Channel name")
		userId := buyProductCmd.String("user-id", "", "User ID")
		productId := buyProductCmd.String("product-id", "", "Product ID")
		traderId := buyProductCmd.String("trader-id", "", "Trader ID")
		quantity := buyProductCmd.String("quantity", "1", "Quantity to buy")

		buyProductCmd.Parse(os.Args[2:])
		if *userId == "" || *productId == "" || *traderId == "" {
			log.Fatal("--user-id, --product-id, and --trader-id are required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIBuyProduct(*channel, *userId, *productId, *traderId, *quantity)
		})

	case "deposit-money":
		depositCmd := flag.NewFlagSet("deposit-money", flag.ExitOnError)
		org := depositCmd.String("org", "org1", "Organization")
		user := depositCmd.String("user", "User1", "User identity")
		channel := depositCmd.String("channel", "channel-a", "Channel name")
		id := depositCmd.String("id", "", "User or Trader ID")
		amount := depositCmd.String("amount", "100", "Amount to deposit")

		depositCmd.Parse(os.Args[2:])
		if *id == "" {
			log.Fatal("--id is required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIDepositMoney(*channel, *id, *amount)
		})

	case "query-by-multiple":
		queryCmd := flag.NewFlagSet("query-by-multiple", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		name := queryCmd.String("name", "", "Product name")
		productId := queryCmd.String("product-id", "", "Product ID")
		traderType := queryCmd.String("type", "", "Trader type")
		price := queryCmd.String("price", "", "Max price")

		queryCmd.Parse(os.Args[2:])
		executeCLI(*org, *user, *channel, func() {
			handleCLIGetProductsByMultipleCategories(*channel, *name, *productId, *traderType, *price)
		})

	case "query-by-multiple-range":
		queryCmd := flag.NewFlagSet("query-by-multiple-range", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		name := queryCmd.String("name", "", "Product name")
		productId := queryCmd.String("product-id", "", "Product ID")
		traderType := queryCmd.String("type", "", "Trader type")
		minPrice := queryCmd.String("min-price", "", "Minimum price")
		maxPrice := queryCmd.String("max-price", "", "Maximum price")

		queryCmd.Parse(os.Args[2:])
		executeCLI(*org, *user, *channel, func() {
			handleCLIGetProductsByMultipleCategoriesPriceRange(*channel, *name, *productId, *traderType, *minPrice, *maxPrice)
		})

	case "query-by-name":
		queryCmd := flag.NewFlagSet("query-by-name", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		name := queryCmd.String("name", "", "Product name")

		queryCmd.Parse(os.Args[2:])
		executeCLI(*org, *user, *channel, func() {
			handleCLIQueryProductsByName(*channel, *name)
		})

	case "query-by-id":
		queryCmd := flag.NewFlagSet("query-by-id", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		productId := queryCmd.String("product-id", "", "Product ID")

		queryCmd.Parse(os.Args[2:])
		if *productId == "" {
			log.Fatal("--product-id is required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIQueryProductsById(*channel, *productId)
		})

	case "query-by-type":
		queryCmd := flag.NewFlagSet("query-by-type", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		traderType := queryCmd.String("type", "", "Trader type")

		queryCmd.Parse(os.Args[2:])
		if *traderType == "" {
			log.Fatal("--type is required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIQueryProductsByTraderType(*channel, *traderType)
		})

	case "query-by-price-range":
		queryCmd := flag.NewFlagSet("query-by-price-range", flag.ExitOnError)
		org := queryCmd.String("org", "org1", "Organization")
		user := queryCmd.String("user", "User1", "User identity")
		channel := queryCmd.String("channel", "channel-a", "Channel name")
		minPrice := queryCmd.String("min-price", "", "Minimum price")
		maxPrice := queryCmd.String("max-price", "", "Maximum price")

		queryCmd.Parse(os.Args[2:])
		if *minPrice == "" || *maxPrice == "" {
			log.Fatal("Both --min-price and --max-price are required")
		}
		executeCLI(*org, *user, *channel, func() {
			handleCLIQueryProductsByPriceRange(*channel, *minPrice, *maxPrice)
		})

	case "help", "--help", "-h":
		printCLIHelp()

	default:
		printInfo(fmt.Sprintf("Unknown command: %s\n\n", command))
		printCLIHelp()
		os.Exit(1)
	}
}

// executeCLI connects to gateway and executes the operation
func executeCLI(org, user, channel string, operation func()) error {
	printInfo(fmt.Sprintf("\nAttempting to connect as %s from %s...\n", user, org))

	gw, conn, err := client.ConnectGateway(org, user)
	if err != nil {
		return fmt.Errorf("failed to establish connection: %w", err)
	}

	activeGW = gw
	activeConn = conn
	printSuccess("✅ Successfully connected to Fabric Gateway.")
	defer gw.Close()
	defer conn.Close()

	operation()

	return nil
}

func printCLIHelp() {
	printInfo("Commerce SDK - CLI Mode")
	printInfo("\nUsage: commerce-app <command> [options]")
	printInfo("\nGlobal Options:")
	printInfo("  --org <org>         Organization (org1, org2, org3) [default: org1]")
	printInfo("  --user <user>       User identity (User1, Admin) [default: User1]")
	printInfo("  --channel <channel> Channel name (channel-a, channel-b) [default: channel-a]")
	printInfo("\nCommands:")
	printInfo("\nInvoke Operations:")
	printInfo("  create-trader        Create a new trader")
	printInfo("  create-user          Create a new user")
	printInfo("  create-product       Create a new product")
	printInfo("  add-product-to-trader Add product to trader's inventory")
	printInfo("  buy-product          Buy a product")
	printInfo("  deposit-money        Deposit money to user/trader account")
	printInfo("\nQuery Operations:")
	printInfo("  query-by-multiple    Query products by multiple criteria")
	printInfo("  query-by-multiple-range Query products with price range")
	printInfo("  query-by-name        Query products by name")
	printInfo("  query-by-id          Query products by ID")
	printInfo("  query-by-type        Query products by trader type")
	printInfo("  query-by-price-range Query products by price range")
	printInfo("\nExamples:")
	printInfo("  commerce-app create-trader --org org1 --type SUPERMARKET --vat 123456 --balance 50000")
	printInfo("  commerce-app create-user --name Alice --surname Smith --email alice@example.com --balance 5000")
	printInfo("  commerce-app query-by-name --name Milk")
	printInfo("  commerce-app buy-product --user-id USER_123 --product-id PRODUCT_456 --trader-id TRADER_789 --quantity 5")
	printInfo("\nFor command-specific help:")
	printInfo("  commerce-app <command> --help")
}

func handleCLICreateTrader(channelName, traderType, vat, balance string) {
	blockNumber, ID := client.CreateTrader(activeGW, channelName, traderType, vat, balance)

	printInfo(fmt.Sprintf("\nTrader with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))
}

func handleCLICreateUser(channelName, name, surname, email, balance string) {
	blockNumber, ID := client.CreateUser(activeGW, channelName, name, surname, email, balance)

	printInfo(fmt.Sprintf("\nUser with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))
}

func handleCLICreateProduct(channelName, name, expiryDate, price, quantity, traderType string) {
	blockNumber, ID := client.CreateProduct(activeGW, channelName, name, expiryDate, price, quantity, traderType)

	printInfo(fmt.Sprintf("\nProduct with ID %s was created successfully on channel %s. Block number: %d\n", ID, channelName, blockNumber))
}

func handleCLIAddProductToTrader(channelName, productId, traderId string) {
	blockNumber := client.AddProductToTrader(activeGW, channelName, productId, traderId)

	printInfo(fmt.Sprintf("\nProduct with ID %s was added successfully to trader %s on channel %s. Block number: %d\n", productId, traderId, channelName, blockNumber))

}

func handleCLIBuyProduct(channelName, userId, productId, traderId, quantity string) {
	blockNumber, ID := client.BuyProduct(activeGW, channelName, userId, productId, traderId, quantity)

	printInfo(fmt.Sprintf("\nProduct was bought successfully on channel %s. Block number: %d, Receipt number: %s\n", channelName, blockNumber, ID))
}

func handleCLIDepositMoney(channelName, userId, amount string) {
	blockNumber := client.DepositMoney(activeGW, channelName, userId, amount)

	printInfo(fmt.Sprintf("\nMoney was deposited successfully to %s on channel %s. Block number: %d\n", userId, channelName, blockNumber))
}

func handleCLIGetProductsByMultipleCategories(channelName, name, productId, traderType, price string) {
	err := client.GetProductsByMultipleCategories(activeGW, channelName, name, productId, traderType, price)
	if err != nil {
		return
	}
}

func handleCLIGetProductsByMultipleCategoriesPriceRange(channelName, name, productId, traderType, minPrice, maxPrice string) {
	err := client.GetProductsByMultipleCategoriesPriceRange(activeGW, channelName, name, productId, traderType, minPrice, maxPrice)
	if err != nil {
		return
	}
}

func handleCLIQueryProductsByName(channelName, name string) {
	err := client.QueryProductsByName(activeGW, channelName, name)
	if err != nil {
		return
	}
}

func handleCLIQueryProductsById(channelName, productId string) {
	err := client.QueryProductsById(activeGW, channelName, productId)
	if err != nil {
		return
	}
}

func handleCLIQueryProductsByTraderType(channelName, traderType string) {
	err := client.QueryProductsByTraderType(activeGW, channelName, traderType)
	if err != nil {
		return
	}
}

func handleCLIQueryProductsByPriceRange(channelName, minPrice, maxPrice string) {
	err := client.QueryProductsByPriceRange(activeGW, channelName, minPrice, maxPrice)
	if err != nil {
		return
	}
}
