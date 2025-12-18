package api

import (
	"commerce-sdk/client"
	"commerce-sdk/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	fabricclient "github.com/hyperledger/fabric-gateway/pkg/client"
	"google.golang.org/grpc"
)

var (
	activeGW   *fabricclient.Gateway
	activeConn *grpc.ClientConn
)

type ConnectionBody struct {
	Organization string `json:"organization"`
	UserId       string `json:"userId"`
}

func CreateServer() {
	if activeGW != nil {
		activeGW.Close()
		activeGW = nil
	}
	if activeConn != nil {
		activeConn.Close()
		activeConn = nil
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},

		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},

		AllowHeaders: []string{"Origin", "Content-Type"},

		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	router.GET("/api-status", getApiStatus)
	router.POST("/connect", connectClient)
	router.POST("/disconnect", disconnectClient)
	router.POST("/user/:channel", createUser)
	router.POST("/trader/:channel", createTrader)
	router.POST("/product/:channel", createProduct)
	router.POST("/order/:channel", createOrder)

	router.GET("/users/:channel", getUsers)
	router.GET("/traders/:channel", getTraders)
	router.GET("/products/:channel", getProducts)
	router.GET("/receipts/:channel", getReceipts)

	router.PUT("/users/:channel", updateUser)
	router.PUT("/traders/:channel", updateTrader)
	router.PUT("/products/:channel", updateProduct)

	router.DELETE("/users/:channel/:id", deleteUser)
	router.DELETE("/traders/:channel/:id", deleteTrader)
	router.DELETE("/products/:channel/:id", deleteProduct)
	router.DELETE("/receipts/:channel/:id", deleteReceipt)

	router.POST("/deposit-money/:channel", depositMoney)
	router.POST("/increase-quantity/:channel", increaseQuantity)
	router.POST("/traders/:channel/products", getTradersProducts)
	router.POST("/receipts/:channel", getReceiptsByIds)
	router.POST("/orders/:channel", getOrdersByIds)
	router.POST("/traders-products/:channel", addProductsToTrader)

	router.GET("/users/details/:userId/:channel", getUserDetails)
	router.GET("/traders/details/:traderId/:channel", getTraderDetails)
	router.GET("/receipts/details/:receiptId/:channel", getReceiptDetails)
	router.GET("/orders/details/:orderId/:channel", getOrderDetails)

	router.Run("localhost:8080")
}

func getApiStatus(c *gin.Context) {
	c.JSON(200, gin.H{"Hello": "World"})
}
func connectClient(c *gin.Context) {
	var payload ConnectionBody

	if err := c.BindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request"})
		return
	}
	orgName := payload.Organization
	userId := payload.UserId
	fmt.Println(payload)

	gw, conn, err := client.ConnectGateway(strings.ToLower(orgName), userId)
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to establish connection"})
		return
	}

	activeGW = gw
	activeConn = conn

	c.JSON(200, gin.H{"Message": "Conntected to gateway"})

}
func disconnectClient(c *gin.Context) {
	err := activeGW.Close()
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to disconnect"})
		return
	}
	err = activeConn.Close()
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to disconnect"})
		return
	}
	activeGW = nil
	activeConn = nil

	c.JSON(200, gin.H{"Message": "Disconntected from the gateway"})
}

func createUser(c *gin.Context) {
	var User models.User
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&User); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request"})
		return
	}

	fmt.Println(User)

	blockNumber, ID := client.CreateUser(activeGW, channel, User.Name, User.Surname, User.Email, fmt.Sprint(User.Balance))

	c.JSON(201, gin.H{"Message": fmt.Sprintf("User created %d %s", blockNumber, ID)})

}
func createTrader(c *gin.Context) {
	var Trader models.Trader
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&Trader); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request"})
		return
	}

	fmt.Println(Trader)

	blockNumber, ID := client.CreateTrader(activeGW, channel, Trader.Name, string(Trader.TraderType), Trader.VAT, Trader.Email, fmt.Sprint(Trader.Balance))

	c.JSON(201, gin.H{"Message": fmt.Sprintf("Trader created %d %s", blockNumber, ID)})
}
func createProduct(c *gin.Context) {
	var Product models.Product
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&Product); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}
	fmt.Println(Product)

	blockNumber, ID := client.CreateProduct(activeGW, channel, Product.Name, Product.ExpiryDate.Format("2006-01-02 15:04:05"), fmt.Sprint(Product.Price), strconv.Itoa(Product.Quantity), string(Product.TraderType))

	c.JSON(201, gin.H{"Message": fmt.Sprintf("Product created %d %s", blockNumber, ID)})
}
func createOrder(c *gin.Context) {
	var orderData struct {
		UserId   string                    `json:"user-id"`
		Products []models.ProductInventory `json:"products"`
	}

	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&orderData); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}

	args := []string{orderData.UserId}

	for _, p := range orderData.Products {
		args = append(args, p.ProductId)
		args = append(args, strconv.Itoa(int(p.Quantity)))
	}

	//fmt.Println(args[0])
	//fmt.Println(channel)

	blockNumber, ID := client.CreateOrder(activeGW, channel, args)

	c.JSON(201, gin.H{"Message": fmt.Sprintf("Receipt created %d %s", blockNumber, ID)})
	//c.JSON(201, gin.H{"Message": fmt.Sprintf("Receipt created %d %s")})
}

func getUsers(c *gin.Context) {
	var channel string
	channel = c.Param("channel")

	users, err := client.QueryAllUsers(activeGW, channel)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}
	c.JSON(200, gin.H{"Users": users})
}
func getTraders(c *gin.Context) {
	var channel string
	channel = c.Param("channel")

	traders, err := client.QueryAllTraders(activeGW, channel)
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to establish connection"})
	}
	fmt.Println(traders)
	c.JSON(200, gin.H{"Traders": traders})
}
func getReceipts(c *gin.Context) {
	var channel string
	channel = c.Param("channel")

	receipts, err := client.QueryAllReceipts(activeGW, channel)
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to establish connection"})
	}
	fmt.Println(receipts)
	c.JSON(200, gin.H{"Receipts": receipts})
}
func getProducts(c *gin.Context) {
	var channel string
	channel = c.Param("channel")

	products, err := client.QueryAllProducts(activeGW, channel)
	if err != nil {
		c.JSON(500, gin.H{"Message": "Failed to establish connection"})
	}
	fmt.Println(products)
	c.JSON(200, gin.H{"Products": products})
}

func updateUser(c *gin.Context) {
	var User models.User
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&User); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request"})
		return
	}

	fmt.Println(User)

	blockNumber, err := client.UpdateUser(activeGW, channel, User.Id, User.Name, User.Surname, User.Email)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"Message": fmt.Sprintf("User updated at block %d", blockNumber)})
}
func updateTrader(c *gin.Context) {
	var Trader models.Trader
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&Trader); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request"})
		return
	}

	fmt.Println(Trader)

	blockNumber, err := client.UpdateTrader(activeGW, channel, Trader.Id, Trader.Name, Trader.VAT, Trader.Email, string(Trader.TraderType))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Trader updated %d", blockNumber)})
}
func updateProduct(c *gin.Context) {
	var Product models.Product
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&Product); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}
	fmt.Println(Product)

	blockNumber, err := client.UpdateProduct(activeGW, channel, Product.Id, Product.Name, Product.ExpiryDate.Format("2006-01-02 15:04:05"), fmt.Sprint(Product.Price), string(Product.TraderType))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Product updated %d", blockNumber)})
}

func deleteUser(c *gin.Context) {
	var channel, id string

	channel = c.Param("channel")
	id = c.Param("id")

	blockNumber, err := client.DeleteUser(activeGW, channel, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("User deleted %d", blockNumber)})
}
func deleteTrader(c *gin.Context) {
	var channel, id string

	channel = c.Param("channel")
	id = c.Param("id")

	blockNumber, err := client.DeleteTrader(activeGW, channel, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Trader deleted %d", blockNumber)})
}
func deleteProduct(c *gin.Context) {
	var channel, id string

	channel = c.Param("channel")
	id = c.Param("id")

	blockNumber, err := client.DeleteProduct(activeGW, channel, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Product deleted %d", blockNumber)})
}
func deleteReceipt(c *gin.Context) {
	var channel, id string

	channel = c.Param("channel")
	id = c.Param("id")

	blockNumber, err := client.DeleteReceipt(activeGW, channel, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Receipt deleted %d", blockNumber)})
}

func depositMoney(c *gin.Context) {
	var channel string
	var depositObject models.DepositObject
	channel = c.Param("channel")

	if err := c.BindJSON(&depositObject); err != nil {
		c.JSON(400, gin.H{"Message": fmt.Sprintf("Cannot parse request. Error: %s", err.Error())})
		return
	}

	blockNumber, err := client.DepositMoney(activeGW, channel, depositObject.UserId, fmt.Sprint(depositObject.Amount))
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Cannot deposit money %s", err.Error())})
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Deposited money %d", blockNumber)})
}
func increaseQuantity(c *gin.Context) {
	var channel string
	var increaseObject models.ProductInventory
	channel = c.Param("channel")

	if err := c.BindJSON(&increaseObject); err != nil {
		c.JSON(400, gin.H{"Message": fmt.Sprintf("Cannot parse request. Error: %s", err.Error())})
		return
	}

	blockNumber, err := client.IncreaseQuantity(activeGW, channel, increaseObject.ProductId, fmt.Sprint(increaseObject.Quantity))
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Cannot deposit money %s", err.Error())})
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Deposited money %d", blockNumber)})
}

func getTradersProducts(c *gin.Context) {
	var request struct {
		ProductIds []string `json:"product-ids"`
	}

	var channel string
	channel = c.Param("channel")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	//fmt.Println("Request:", request)
	//fmt.Println("Product IDs:", request.ProductIds)

	products, err := client.GetProductsByIds(activeGW, channel, request.ProductIds)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	productsJSON, err := json.Marshal(products)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to marshal products"})
		return
	}

	c.JSON(200, gin.H{
		"Message":  "Products retrieved successfully",
		"Products": string(productsJSON),
	})
}
func getReceiptsByIds(c *gin.Context) {
	var request struct {
		ReceiptIds []string `json:"receipt-ids"`
	}

	var channel string
	channel = c.Param("channel")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	//fmt.Println("Request:", request)
	//fmt.Println("Request IDs:", request.ReceiptIds)

	receipts, err := client.GetReceiptsByIds(activeGW, channel, request.ReceiptIds)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	receiptsJSON, err := json.Marshal(receipts)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to marshal products"})
		return
	}

	c.JSON(200, gin.H{
		"Message":  "Receipts retrieved successfully",
		"Receipts": string(receiptsJSON),
	})
}
func getOrdersByIds(c *gin.Context) {
	var request struct {
		OrdersIds []string `json:"orders-ids"`
	}

	var channel string
	channel = c.Param("channel")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	//fmt.Println("Request:", request)
	//fmt.Println("Order IDs:", request.OrdersIds)

	orders, err := client.GetOrdersByIds(activeGW, channel, request.OrdersIds)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	ordersJSON, err := json.Marshal(orders)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to marshal orders"})
		return
	}

	c.JSON(200, gin.H{
		"Message": "Orders retrieved successfully",
		"Orders":  string(ordersJSON),
	})
}
func addProductsToTrader(c *gin.Context) {
	var request struct {
		Products []models.ProductInventory `json:"products"`
		TraderId string                    `json:"trader-id"`
	}
	var channel string
	channel = c.Param("channel")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	args := []string{request.TraderId}

	for _, p := range request.Products {
		args = append(args, p.ProductId)
		args = append(args, strconv.Itoa(int(p.Quantity)))
	}

	blockNumber, err := client.AddProductsToTrader(activeGW, channel, args)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Products added to trader %s %d", request.TraderId, blockNumber)})
}

// getUserDetails fetches all necessary entities for User Details
func getUserDetails(c *gin.Context) {
	var channel, userId string
	var response models.UserDetailsResponse
	var orders []*models.Order
	var receipts []*models.Receipt
	var products []*models.Product
	channel = c.Param("channel")
	userId = c.Param("userId")

	// Get user by id
	user, err := client.GetUserById(activeGW, channel, userId)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get its orders
	if len(user.OrdersIds) > 0 {

		orders, err = client.GetOrdersByIds(activeGW, channel, user.OrdersIds)
		if err != nil {
			c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
		}

		// Get unique productIds and receipts ids
		productsIds, receiptsIds := getUniqueProductIdsAndReceiptIds(orders)

		// Get products
		products, err = client.GetProductsByIds(activeGW, channel, productsIds)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Get receipts
		receipts, err = client.GetReceiptsByIds(activeGW, channel, receiptsIds)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

	}
	// Build response
	response = models.UserDetailsResponse{
		User:   user,
		Orders: buildOrdersWithDetails(orders, products, receipts),
	}

	c.JSON(http.StatusOK, response)
}

// getTraderDetails fetches all necessary entities for Trader Details
func getTraderDetails(c *gin.Context) {
	var channel, traderId string
	var receipts []*models.Receipt
	var receiptsProducts, availableProducts []*models.Product
	channel = c.Param("channel")
	traderId = c.Param("traderId")

	// Get trader by id
	trader, err := client.GetTraderById(activeGW, channel, traderId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(trader.ReceiptsIDs) > 0 {
		// Get trader's receipts
		receipts, err = client.GetReceiptsByIds(activeGW, channel, trader.ReceiptsIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	productIds := getAllTradersProducts(receipts, trader)

	// Get all products
	products, err := client.GetProductsByIds(activeGW, channel, productIds)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, product := range products {
		// Check if product is in receipts
		for _, receipt := range receipts {
			for _, receiptProduct := range receipt.Products {
				if receiptProduct.ProductId == product.Id {
					receiptsProducts = append(receiptsProducts, product)
				}
			}
		}

		// Check if product is available (fix this part)
		for _, inv := range trader.ProductsAvailable {
			if inv.ProductId == product.Id { // Changed
				availableProducts = append(availableProducts, product)
				break
			}
		}
	}

	// Build response
	response := models.TraderDetailsResponse{
		Trader:            trader,
		Receipts:          receipts,
		ReceiptsProducts:  receiptsProducts,
		AvailableProducts: availableProducts,
	}

	c.JSON(http.StatusOK, response)
}

// getReceiptDetails fetches all necessary entities for Receipt Details
func getReceiptDetails(c *gin.Context) {
	var channel, receiptId string
	channel = c.Param("channel")
	receiptId = c.Param("receiptId")

	// Get receipt
	receipt, err := client.GetReceiptById(activeGW, channel, receiptId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get products
	products, err := client.GetProductsByIds(activeGW, channel, getAllProductIds(receipt.Products))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get trader and user info
	trader, err := client.GetTraderById(activeGW, channel, receipt.TraderId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user, err := client.GetUserById(activeGW, channel, receipt.UserId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build response
	response := models.ReceiptDetailsResponse{
		Receipt:  receipt,
		Products: products,
		Trader:   trader,
		User:     user,
	}

	c.JSON(http.StatusOK, response)
}

// getOrderDetails fetches all necessary entities for User Details
func getOrderDetails(c *gin.Context) {
	var channel, orderId string
	var response models.OrderWithDetails
	var receipts []*models.Receipt
	var products []*models.Product
	channel = c.Param("channel")
	orderId = c.Param("orderId")

	// Get order by id
	order, err := client.GetOrderById(activeGW, channel, orderId)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get receipts by ids
	receipts, err = client.GetReceiptsByIds(activeGW, channel, order.ReceiptsIds)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get products by ids
	productIds := getAllProductIds(order.Products)

	products, err = client.GetProductsByIds(activeGW, channel, productIds)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Build response
	response = models.OrderWithDetails{
		Order:    order,
		Products: products,
		Receipts: receipts,
	}

	c.JSON(http.StatusOK, response)
}

// buildOrdersWithDetails helper function for building response
func buildOrdersWithDetails(orders []*models.Order, allProducts []*models.Product, allReceipts []*models.Receipt) []models.OrderWithDetails {
	// Create maps for quick lookup
	productMap := make(map[string]*models.Product)
	for _, p := range allProducts {
		productMap[p.Id] = p
	}

	receiptMap := make(map[string]*models.Receipt)
	for _, r := range allReceipts {
		receiptMap[r.Id] = r
	}

	// Build detailed orders
	result := make([]models.OrderWithDetails, 0, len(orders))
	for _, order := range orders {
		orderProducts := make([]*models.Product, 0)
		for _, productItem := range order.Products {
			if p, exists := productMap[productItem.ProductId]; exists {
				orderProducts = append(orderProducts, p)
			}
		}

		orderReceipts := make([]*models.Receipt, 0)
		for _, rid := range order.ReceiptsIds {
			if r, exists := receiptMap[rid]; exists {
				orderReceipts = append(orderReceipts, r)
			}
		}

		result = append(result, models.OrderWithDetails{
			Order:    order,
			Products: orderProducts,
			Receipts: orderReceipts,
		})
	}

	return result
}

// getUniqueProductIdsAndReceiptIds For fetching unique product ids and receipt ids from orders
func getUniqueProductIdsAndReceiptIds(orders []*models.Order) ([]string, []string) {
	// For each order, collect product IDs and receipt IDs
	productIDsMap := make(map[string]bool)
	var allReceiptIDs []string

	for _, order := range orders {
		for _, productItem := range order.Products {
			productIDsMap[productItem.ProductId] = true
		}
		allReceiptIDs = append(allReceiptIDs, order.ReceiptsIds...)
	}

	// Get all unique products
	productIDs := make([]string, 0, len(productIDsMap))
	for id := range productIDsMap {
		productIDs = append(productIDs, id)
	}
	return productIDs, allReceiptIDs
}

// getAllTradersProducts Collects all products ids
func getAllTradersProducts(receipts []*models.Receipt, trader *models.Trader) []string {
	// Collect product IDs from receipts
	productIDsMap := make(map[string]bool)
	for _, receipt := range receipts {
		for _, product := range receipt.Products {
			productIDsMap[product.ProductId] = true
		}
	}

	// Add trader's available products
	for _, product := range trader.ProductsAvailable {
		productIDsMap[product.ProductId] = true
	}

	productIDs := make([]string, 0, len(productIDsMap))
	for id := range productIDsMap {
		productIDs = append(productIDs, id)
	}
	return productIDs
}

// getAllProductIds Get all products from products
func getAllProductIds(products []models.ProductInventory) []string {
	var productIds []string
	for _, product := range products {
		productIds = append(productIds, product.ProductId)
	}

	return productIds
}
