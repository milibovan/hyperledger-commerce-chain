package main

import "fmt"

const (
	Reset   = "\033[0m"
	Red     = "\033[31m"
	Green   = "\033[32m"
	Yellow  = "\033[33m"
	Blue    = "\033[34m"
	Magenta = "\033[35m"
	Cyan    = "\033[36m"
	White   = "\033[37m"

	// Bold colors
	BoldRed     = "\033[1;31m"
	BoldGreen   = "\033[1;32m"
	BoldYellow  = "\033[1;33m"
	BoldBlue    = "\033[1;34m"
	BoldMagenta = "\033[1;35m"
	BoldCyan    = "\033[1;36m"

	// Background colors
	BgRed    = "\033[41m"
	BgGreen  = "\033[42m"
	BgYellow = "\033[43m"
)

func printSuccess(message string) {
	fmt.Println(Green + "✅ " + message + Reset)
}

func printError(message string) {
	fmt.Println(Red + "❌ " + message + Reset)
}

func printWarning(message string) {
	fmt.Println(Yellow + "⚠️ " + message + Reset)
}

func printInfo(message string) {
	fmt.Println(Blue + "ℹ️ " + message + Reset)
}

func printHeader(message string) {
	fmt.Println(BoldCyan + "\n" + message + Reset)
}

func printSubHeader(message string) {
	fmt.Println(BoldBlue + message + Reset)
}
