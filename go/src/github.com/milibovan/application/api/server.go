package api

import (
	"commerce-sdk/client"
	"commerce-sdk/models"
	"fmt"
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

	blockNumber, ID := client.CreateTrader(activeGW, channel, Trader.Name, string(Trader.TraderType), Trader.VAT, fmt.Sprint(Trader.Balance))

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

	blockNumber, err := client.UpdateTrader(activeGW, channel, Trader.Id, Trader.Name, Trader.VAT, string(Trader.TraderType))
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
