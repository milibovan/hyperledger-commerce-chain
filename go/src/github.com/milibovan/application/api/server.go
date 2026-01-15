package api

import (
	"commerce-sdk/client"
	"commerce-sdk/kafka"
	"commerce-sdk/models"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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

const (
	bootstrapServers  = "kafka1:9092,kafka2:9092,kafka3:9092"
	schemaRegistryUrl = "http://schema-registry:8081"
	topic             = "notifications"
)

func CreateServer() {
	if activeGW != nil {
		activeGW.Close()
		activeGW = nil
	}
	if activeConn != nil {
		activeConn.Close()
		activeConn = nil
	}

	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092,localhost:9094,localhost:9096"
	}

	schemaRegistryURL := os.Getenv("SCHEMA_REGISTRY_URL")
	if schemaRegistryURL == "" {
		schemaRegistryURL = "http://localhost:8081"
	}

	kafka.InitKafka(kafkaBrokers, schemaRegistryURL)

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
	router.PUT("/request/:requestId/:channel", updateRequest)

	router.PUT("/request/approve/:traderId/:requestId/:channel", approveRequest)
	router.PUT("/request/fulfill/:requestId/:channel", fulfillRequest)

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
	router.GET("/requests/details/:requestId/:channel", getRequestDetails)

	router.POST("/order/request/:channel", createProductRequest)

	defer kafka.CloseKafka()

	router.Run(":7070")
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

	c.JSON(201, gin.H{"Message": fmt.Sprintf("Order created %d %s", blockNumber, ID)})
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
func updateRequest(c *gin.Context) {
	var request struct {
		Status string `json:"status"`
	}
	var channel, requestId string

	channel = c.Param("channel")
	requestId = c.Param("requestId")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}

	blockNumber, _, err := client.UpdateRequest(activeGW, channel, requestId, request.Status, "", "")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"Message": fmt.Sprintf("Request updated %d", blockNumber)})
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
	var requests []*models.RequestDetailsResponse
	channel = c.Param("channel")
	userId = c.Param("userId")

	// Get user by id
	user, err := client.GetUserById(activeGW, channel, userId)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get its orders
	if len(user.OrdersIDs) > 0 {

		orders, err = client.GetOrdersByIds(activeGW, channel, user.OrdersIDs)
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

	// Get its requests
	if len(user.RequestsIDs) > 0 {
		userRequests, err := client.GetRequestsByIds(activeGW, channel, user.RequestsIDs)
		if err != nil {
			c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
		}

		for _, request := range userRequests {
			productIds := getAllProductIds(request.Products)

			products, err = client.GetProductsByIds(activeGW, channel, productIds)
			if err != nil {
				c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to get products by request %s", err)})
			}

			requests = append(requests, &models.RequestDetailsResponse{
				Request:  request,
				Products: products,
			})
		}
	}

	// Build response
	response = models.UserDetailsResponse{
		User:     user,
		Orders:   buildOrdersDetailsResponse(orders, products, receipts),
		Requests: requests,
	}

	c.JSON(http.StatusOK, response)
}

// getTraderDetails fetches all necessary entities for Trader Details
func getTraderDetails(c *gin.Context) {
	var channel, traderId string
	var receipts []*models.Receipt
	var receiptsProducts, availableProducts []*models.Product
	var requests, availableRequests []*models.RequestDetailsResponse
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

	if len(trader.RequestsIDs) > 0 {
		traderRequests, err := client.GetRequestsByIds(activeGW, channel, trader.RequestsIDs)
		if err != nil {
			c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
		}

		for _, request := range traderRequests {
			productIds := getAllProductIds(request.Products)

			products, err = client.GetProductsByIds(activeGW, channel, productIds)
			if err != nil {
				c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to get products by request %s", err)})
			}
			user, err := client.GetUserById(activeGW, channel, request.UserId)
			if err != nil {
				c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to get products by request %s", err)})
			}

			requests = append(requests, &models.RequestDetailsResponse{
				Request:  request,
				Products: products,
				User:     user,
			})
		}
	}

	unassignedRequests, err := client.GetUnassignedRequests(activeGW, channel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(unassignedRequests) > 0 {
		for _, request := range unassignedRequests {
			productIds = getAllProductIds(request.Products)

			products, err = client.GetProductsByIds(activeGW, channel, productIds)
			if err != nil {
				c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to get products by request %s", err)})
			}

			user, err := client.GetUserById(activeGW, channel, request.UserId)
			if err != nil {
				c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to get users by request %s", err)})
			}

			availableRequests = append(availableRequests, &models.RequestDetailsResponse{
				Request:  request,
				Products: products,
				User:     user,
			})
		}
	}

	// Build response
	response := models.TraderDetailsResponse{
		Trader:            trader,
		Receipts:          receipts,
		ReceiptsProducts:  receiptsProducts,
		AvailableProducts: availableProducts,
		Requests:          requests,
		AvailableRequests: availableRequests,
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
	var response models.OrderDetailsResponse
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
	response = models.OrderDetailsResponse{
		Order:    order,
		Products: products,
		Receipts: receipts,
	}

	c.JSON(http.StatusOK, response)
}

// getRequestDetails fetches all necessary entities for User Details
func getRequestDetails(c *gin.Context) {
	var channel, requestId string
	var response models.RequestDetailsResponse
	var products []*models.Product
	channel = c.Param("channel")
	requestId = c.Param("requestId")

	// Get request by id
	request, err := client.GetRequestById(activeGW, channel, requestId)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get user by id
	user, err := client.GetUserById(activeGW, channel, request.UserId)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Get products by ids
	productIds := getAllProductIds(request.Products)

	products, err = client.GetProductsByIds(activeGW, channel, productIds)
	if err != nil {
		c.JSON(500, gin.H{"Message": fmt.Sprintf("Failed to establish connection %s", err)})
	}

	// Build response
	response = models.RequestDetailsResponse{
		Products: products,
		Request:  request,
		User:     user,
	}

	c.JSON(http.StatusOK, response)
}

// createProductRequest Create order request for products not in stock or not at any trader's
func createProductRequest(c *gin.Context) {
	var requestData models.CreateRequest
	var channel string

	channel = c.Param("channel")

	if err := c.BindJSON(&requestData); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}

	args := []string{}
	maxDays := 0

	for _, p := range requestData.Products {
		args = append(args, p.ProductId)
		args = append(args, strconv.Itoa(int(p.Quantity)))
		if p.DeliveryDays > maxDays {
			maxDays = p.DeliveryDays
		}
	}

	blockNumber, ID, createRequest := client.CreateRequest(
		activeGW,
		channel,
		requestData.UserId,
		requestData.UserEmail,
		strconv.Itoa(int(requestData.TotalCost)),
		strconv.Itoa(maxDays),
		args)

	totalCost := strconv.FormatFloat(createRequest.TotalCost, 'f', 3, 64)

	var products []string

	for _, p := range requestData.Products {
		products = append(products, p.ProductId)
		products = append(products, strconv.Itoa(int(p.Quantity)))
		if p.DeliveryDays > maxDays {
			maxDays = p.DeliveryDays
		}
	}

	emails, err := client.GetTradersEmails(activeGW, channel)
	if err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}

	currentTime := time.Now()
	requestCreatedNotification := models.NotificationEvent{
		Id:                ID,
		EventType:         models.RequestCreated,
		RecipientType:     []models.RecipientType{models.USER, models.TRADER},
		RecipientID:       requestData.UserId,
		Timestamp:         &currentTime,
		ScheduledSendTime: nil,
		Channel:           models.EMAIL,
		OrderID:           "",
		UserID:            requestData.UserId,
		TraderID:          "",
		Data: map[string]string{
			"request_id":        createRequest.Id,
			"request_date":      createRequest.CreatedDate,
			"due_date":          createRequest.DueDate,
			"item_count":        strconv.Itoa(len(createRequest.Products)),
			"products":          strings.Join(products, ","),
			"total_amount":      totalCost,
			"url":               "https://hyperledger.commerce/requests/ord_987654",
			"user_name":         requestData.UserName,
			"recipients":        requestData.UserEmail,
			"trader_recipients": strings.Join(emails, ","),
		},
	}

	err = kafka.ProduceToKafka(requestCreatedNotification, topic)
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(emails)

	c.JSON(http.StatusCreated, gin.H{"Message": fmt.Sprintf("Request created %d %s", blockNumber, ID)})
}

// approveRequest Approve and assign request to trader
func approveRequest(c *gin.Context) {
	var channel, traderId, requestId string

	var request struct {
		UserId      string  `json:"user-id"`
		UserEmail   string  `json:"user-email"`
		TraderName  string  `json:"trader-name"`
		TraderEmail string  `json:"trader-email"`
		DueDate     string  `json:"due-date"`
		TotalCost   float64 `json:"total-cost"`
	}

	channel = c.Param("channel")
	traderId = c.Param("traderId")
	requestId = c.Param("requestId")

	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request", "Error": err.Error()})
		return
	}
	totalCost := strconv.FormatFloat(request.TotalCost, 'f', 3, 64)

	blockNumber, _, err := client.UpdateRequest(activeGW, channel, requestId, "APPROVED", "", traderId)
	if err != nil {
		c.JSON(400, gin.H{"Message": "Cannot update request", "Error": err.Error()})
		return
	}

	currentTime := time.Now()
	requestApprovedNotification := models.NotificationEvent{
		Id:                requestId,
		EventType:         models.RequestApproved,
		RecipientType:     []models.RecipientType{models.USER},
		RecipientID:       request.UserId,
		Timestamp:         &currentTime,
		ScheduledSendTime: nil,
		Channel:           models.EMAIL,
		OrderID:           "",
		UserID:            request.UserId,
		TraderID:          traderId,
		Data: map[string]string{
			"request_id":    requestId,
			"approval_date": time.Now().Format(time.RFC3339),
			"trader_name":   request.TraderName,
			"trader_email":  request.TraderEmail,
			"deadline_date": request.DueDate,
			"total_amount":  totalCost,
			"recipient":     request.UserEmail,
			"url":           "https://hyperledger.commerce/requests/ord_987654",
		},
	}

	err = kafka.ProduceToKafka(requestApprovedNotification, topic)
	if err != nil {
		fmt.Println(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"Message": fmt.Sprintf("Request updated %d %s", blockNumber, requestId)})
}

// fulfillRequest Try to fulfill or put in some pending state
func fulfillRequest(c *gin.Context) {
	var channel, requestId string
	var request struct {
		Request *models.RequestDetailsResponse `json:"request"`
		Trader  *models.Trader                 `json:"trader"`
	}

	// 1. Bind JSON
	if err := c.BindJSON(&request); err != nil {
		c.JSON(400, gin.H{"Message": "Cannot parse request body", "Error": err.Error()})
		return
	}

	if request.Request.Request == nil {
		c.JSON(400, gin.H{"Message": "Invalid payload: 'request' data is missing"})
		return
	}
	if request.Request.User == nil {
		c.JSON(400, gin.H{"Message": "Invalid payload: 'user' data is missing"})
		return
	}

	// Now it is safe to access fields
	totalCost := strconv.FormatFloat(request.Request.Request.TotalCost, 'f', 3, 64)

	channel = c.Param("channel")
	requestId = c.Param("requestId")

	blockNumber, description, err := client.UpdateRequest(activeGW, channel, requestId, "FULFILLED", "", "")
	if err != nil {
		c.JSON(400, gin.H{"Message": "Cannot update request on blockchain", "Error": err.Error()})
		return
	}

	// Recalculate these safely now that we know request.User exists
	balance := strconv.FormatFloat(request.Request.User.Balance, 'f', 3, 64)
	shortageVal := request.Request.User.Balance - request.Request.Request.TotalCost
	// If shortage is negative (meaning they have enough funds), we might want to handle that logic,
	// but for formatting:
	shortage := strconv.FormatFloat(shortageVal, 'f', 3, 64)

	if strings.Contains(description, "status PENDING_FUNDS") {
		currentTime := time.Now()
		requestApprovedNotification := models.NotificationEvent{
			Id:                requestId,
			EventType:         models.RequestInsufficientBalance,
			RecipientType:     []models.RecipientType{models.USER},
			RecipientID:       request.Request.Request.UserId,
			Timestamp:         &currentTime,
			ScheduledSendTime: nil,
			Channel:           models.EMAIL,
			OrderID:           "",
			UserID:            request.Request.Request.UserId,
			TraderID:          request.Request.Request.TraderId,
			Data: map[string]string{
				"request_id":      requestId,
				"request_date":    request.Request.Request.CreatedDate,
				"item_count":      strconv.Itoa(len(request.Request.Request.Products)),
				"total_amount":    totalCost,
				"current_balance": balance,
				"required_amount": totalCost,
				"shortage_amount": shortage,
				"recipient":       request.Request.Request.UserEmail,
				"url":             "https://hyperledger.commerce/requests/ord_987654",
			},
		}

		err = kafka.ProduceToKafka(requestApprovedNotification, topic)
		if err != nil {
			fmt.Println("Kafka Error:", err)
		}
	} else {
		split := strings.SplitAfter(description, "order ")
		orderId := split[1]

		currentTime := time.Now()
		requestPaymentCompletedNotification := models.NotificationEvent{
			Id:                requestId,
			EventType:         models.RequestPaymentCompleted,
			RecipientType:     []models.RecipientType{models.USER, models.TRADER},
			RecipientID:       request.Request.Request.UserId,
			Timestamp:         &currentTime,
			ScheduledSendTime: nil,
			Channel:           models.EMAIL,
			OrderID:           orderId,
			UserID:            request.Request.Request.UserId,
			TraderID:          request.Request.Request.TraderId,
			Data: map[string]string{
				"request_id":       requestId,
				"payment_date":     time.Now().Format(time.RFC3339),
				"transaction_id":   fmt.Sprintf("req_%s_ord_%s", requestId, orderId),
				"total_amount":     totalCost,
				"recipient":        request.Request.Request.UserEmail,
				"trader_recipient": request.Trader.Email,
				"url":              "https://hyperledger.commerce/requests/ord_987654",
			},
		}

		err = kafka.ProduceToKafka(requestPaymentCompletedNotification, topic)
		if err != nil {
			fmt.Println("Kafka Error:", err)
		}

		layout := time.RFC3339
		dateString := request.Request.Request.CreatedDate

		parsedTime, err := time.Parse(layout, dateString)
		if err != nil {
			fmt.Println("Error parsing time:", err)
			return
		}

		duration := time.Since(parsedTime)
		var fulfillmentTime string

		if duration.Hours() >= 24 {
			days := int(duration.Hours() / 24)
			fulfillmentTime = fmt.Sprintf("%d days", days)
		} else {
			hours := int(duration.Hours())
			fulfillmentTime = fmt.Sprintf("%d hours", hours)
		}

		requestFulfilledNotification := models.NotificationEvent{
			Id:                requestId,
			EventType:         models.RequestFulfilled,
			RecipientType:     []models.RecipientType{models.USER, models.TRADER},
			RecipientID:       request.Request.Request.UserId,
			Timestamp:         &currentTime,
			ScheduledSendTime: nil,
			Channel:           models.EMAIL,
			OrderID:           orderId,
			UserID:            request.Request.Request.UserId,
			TraderID:          request.Request.Request.TraderId,
			Data: map[string]string{
				"request_id":       requestId,
				"completed_date":   time.Now().Format(time.RFC3339),
				"trader_name":      request.Trader.Name,
				"item_count":       strconv.Itoa(len(request.Request.Request.Products)),
				"total_amount":     totalCost,
				"request_url":      "https://hyperledger.commerce/requests/ord_987654",
				"review_url":       "https://hyperledger.commerce/requests/ord_987654",
				"fulfillment_time": fulfillmentTime,
				"recipient":        request.Request.Request.UserEmail,
				"trader_recipient": request.Trader.Email,
			},
		}

		err = kafka.ProduceToKafka(requestFulfilledNotification, topic)
		if err != nil {
			fmt.Println("Kafka Error:", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"Message": fmt.Sprintf("Request updated in block %d for ID %s", blockNumber, requestId)})
}

// buildOrdersDetailsResponse helper function for building response
func buildOrdersDetailsResponse(orders []*models.Order, allProducts []*models.Product, allReceipts []*models.Receipt) []models.OrderDetailsResponse {
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
	result := make([]models.OrderDetailsResponse, 0, len(orders))
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

		result = append(result, models.OrderDetailsResponse{
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
