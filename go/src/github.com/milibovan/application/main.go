package main

import (
	"commerce-sdk/client"
	"fmt"
	"log"
	"os"
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
	if len(os.Args) > 1 {
		handleCLI()
		return
	}

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

		printHeader("╔════════════════════════════════╗")
		printHeader("║        MAIN MENU               ║")
		printHeader("╔════════════════════════════════╗")
		fmt.Println(Cyan + "1." + Reset + " Connect/Login (Select Org & User)")
		fmt.Println(Cyan + "2." + Reset + " Exit")
		fmt.Print(Yellow + "\nEnter command: " + Reset)

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
				printError(fmt.Sprintf("Connection failed: %v\n", err))
				continue
			}
			if err = handleChannelAndActionMenu(); err != nil {
				return err
			}
		case 2:
			printInfo("Exiting application.")
			return nil
		default:
			printWarning("Invalid command. Please try again.")
		}
	}
}

func connectClient() error {
	var orgName, userID string

	for {
		printSubHeader("\nSelect Organization:")
		fmt.Println(Cyan + "1." + Reset + "Org1")
		fmt.Println(Cyan + "2." + Reset + "Org2")
		fmt.Println(Cyan + "3." + Reset + "Org3")
		fmt.Print(Yellow + "Enter option: " + Reset)
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
			printWarning("Invalid organization option.")
			continue
		}
		break
	}

	for {
		printSubHeader("\nSelect User ID:")
		fmt.Println(Cyan + "1." + Reset + "User1")
		fmt.Println(Cyan + "2." + Reset + "Admin")
		//fmt.Println("3. [Create User - Placeholder]")
		fmt.Print(Yellow + "Enter option: " + Reset)
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
			printWarning("Invalid user option.")
			continue
		}
		break
	}

	printInfo(fmt.Sprintf("\nAttempting to connect as %s from %s...\n", userID, orgName))

	gw, conn, err := client.ConnectGateway(orgName, userID)
	if err != nil {
		return fmt.Errorf("failed to establish connection: %w", err)
	}

	activeGW = gw
	activeConn = conn
	printSuccess("✅ Successfully connected to Fabric Gateway.")

	return nil
}

func handleChannelAndActionMenu() error {
	var channelName string

	channelName = channelSelectionMenu(channelName)

	for {
		printSubHeader(fmt.Sprintf("\n--- ACTION MENU (User: %s on Channel: %s) ---\n", activeGW.Identity(), channelName))
		fmt.Println(Cyan + "1." + Reset + "Invoke (Create Merchant, Buy Product, etc.)")
		fmt.Println(Cyan + "2." + Reset + "Query (Read Product, Rich Queries)")
		fmt.Println(Cyan + "0." + Reset + "Disconnect/Logout")
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
			printInfo("Disconnecting...")
			return nil
		default:
			printWarning("Invalid action command.")
		}

	}
}

func channelSelectionMenu(channelName string) string {
	for {
		printSubHeader("\nSelect Channel:")
		fmt.Println(Cyan + "1." + Reset + "channel-a")
		fmt.Println(Cyan + "2." + Reset + "channel-b")
		fmt.Print(Yellow + "\nEnter option: " + Reset)
		var channelInput int

		_, err := fmt.Scanln(&channelInput)
		if err != nil {
			printWarning("Invalid input. Please enter a number (1 or 2).")
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
			printWarning("Invalid channel option. Please enter 1 or 2.")
			continue
		}
		break
	}
	return channelName
}
