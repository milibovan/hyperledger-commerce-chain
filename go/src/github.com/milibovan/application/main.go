package main

import (
	"commerce-sdk/client"
	"fmt"
	"log"
	"strings"

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
			err = handleQueryMenu()
			if err != nil {
				return err
			}
		case 0:
			fmt.Println("Disconnecting...")
			return nil
		default:
			fmt.Println("Invalid action command.")
		}

	}
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
