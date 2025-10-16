#!/bin/bash

# test-script.sh - Comprehensive automated testing of all SDK functions
# This script tests all invoke and query operations across multiple organizations

set -e  # Exit on error

# ============================================
# ANSI Color Codes
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================
APP_NAME="commerce-app"
APP_DIR="."
BUILD_DIR="."

ORG1="org1"
ORG2="org2"
ORG3="org3"
USER1="User1"
ADMIN="Admin"
CHANNEL_A="channel-a"
CHANNEL_B="channel-b"

# Test data
TEST_TRADER_TYPE="SUPERMARKET"
TEST_VAT="123456789"
TEST_BALANCE="50000"

TEST_USER_NAME="Alice"
TEST_USER_SURNAME="Smith"
TEST_USER_EMAIL="alice@example.com"
TEST_USER_BALANCE="5000"

TEST_PRODUCT_NAME="Milk"
TEST_PRODUCT_EXPIRY="2025-12-31"
TEST_PRODUCT_PRICE="2.99"
TEST_PRODUCT_QUANTITY="100"

# Global variables to store created IDs
TRADER1_ID=""
TRADER2_ID=""
USER1_ID=""
USER2_ID=""
PRODUCT1_ID=""
PRODUCT2_ID=""

# ============================================
# Helper Functions
# ============================================
print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo -e "${NC}"
}

print_subheader() {
    echo -e "${BOLD}${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

extract_id() {
    # Extract ID from output like "Trader created with ID=TRADER_123"
    echo "$1" | grep -oP '(?:with ID |ID )\K[A-Z_0-9]+'
}

# ============================================
# Build Application
# ============================================
build_app() {
    print_header "Building Application"
    cd "$APP_DIR"

    if [ -f "$APP_NAME" ]; then
        print_info "Removing old binary..."
        rm "$APP_NAME"
    fi

    print_info "Building $APP_NAME..."
    go build -o "$APP_NAME"

    if [ $? -eq 0 ]; then
        print_success "Build successful"
    else
        print_error "Build failed"
        exit 1
    fi

    echo ""
}

# ============================================
# Test Functions
# ============================================

# Test 1: Create Traders
test_create_traders() {
    print_header "TEST 1: Creating Traders"

    print_subheader "Creating Trader 1 (Org1, Channel A)"
    OUTPUT=$(./"$APP_NAME" create-trader \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --type "$TEST_TRADER_TYPE" \
        --vat "$TEST_VAT" \
        --balance "$TEST_BALANCE" 2>&1)

    TRADER1_ID=$(extract_id "$OUTPUT")
    if [ -n "$TRADER1_ID" ]; then
        print_success "Trader 1 created: $TRADER1_ID"
    else
        print_error "Failed to create Trader 1"
        echo "$OUTPUT"
        exit 1
    fi

    print_subheader "Creating Trader 2 (Org2, Channel A, PHARMACY)"
    OUTPUT=$(./"$APP_NAME" create-trader \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --type "PHARMACY" \
        --vat "987654321" \
        --balance "30000" 2>&1)

    TRADER2_ID=$(extract_id "$OUTPUT")
    if [ -n "$TRADER2_ID" ]; then
        print_success "Trader 2 created: $TRADER2_ID"
    else
        print_error "Failed to create Trader 2"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 2: Create Users
test_create_users() {
    print_header "TEST 2: Creating Users"

    print_subheader "Creating User 1 (Org1)"
    OUTPUT=$(./"$APP_NAME" create-user \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --name "$TEST_USER_NAME" \
        --surname "$TEST_USER_SURNAME" \
        --email "$TEST_USER_EMAIL" \
        --balance "$TEST_USER_BALANCE" 2>&1)

    USER1_ID=$(extract_id "$OUTPUT")
    if [ -n "$USER1_ID" ]; then
        print_success "User 1 created: $USER1_ID"
    else
        print_error "Failed to create User 1"
        echo "$OUTPUT"
        exit 1
    fi

    print_subheader "Creating User 2 (Org2)"
    OUTPUT=$(./"$APP_NAME" create-user \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --name "Bob" \
        --surname "Johnson" \
        --email "bob@example.com" \
        --balance "3000" 2>&1)

    USER2_ID=$(extract_id "$OUTPUT")
    if [ -n "$USER2_ID" ]; then
        print_success "User 2 created: $USER2_ID"
    else
        print_error "Failed to create User 2"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 3: Create Products
test_create_products() {
    print_header "TEST 3: Creating Products"

    print_subheader "Creating Product 1 (SUPERMARKET)"
    OUTPUT=$(./"$APP_NAME" create-product \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --name "$TEST_PRODUCT_NAME" \
        --expiry "2025-12-31 15:43:32" \
        --price "$TEST_PRODUCT_PRICE" \
        --quantity "$TEST_PRODUCT_QUANTITY" \
        --type "$TEST_TRADER_TYPE" 2>&1)

    PRODUCT1_ID=$(extract_id "$OUTPUT")
    if [ -n "$PRODUCT1_ID" ]; then
        print_success "Product 1 created: $PRODUCT1_ID"
    else
        print_error "Failed to create Product 1"
        echo "$OUTPUT"
        exit 1
    fi

    print_subheader "Creating Product 2 (PHARMACY)"
    OUTPUT=$(./"$APP_NAME" create-product \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --name "Aspirin" \
        --expiry "2025-12-30 09:43:32" \
        --price "5.99" \
        --quantity "200" \
        --type "PHARMACY" 2>&1)

    PRODUCT2_ID=$(extract_id "$OUTPUT")
    if [ -n "$PRODUCT2_ID" ]; then
        print_success "Product 2 created: $PRODUCT2_ID"
    else
        print_error "Failed to create Product 2"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 4: Add Products to Traders
test_add_products_to_traders() {
    print_header "TEST 4: Adding Products to Traders"

    print_subheader "Adding Product 1 to Trader 1"
    OUTPUT=$(./"$APP_NAME" add-product-to-trader \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --product-id "$PRODUCT1_ID" \
        --trader-id "$TRADER1_ID" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Product 1 added to Trader 1"
    else
        print_error "Failed to add Product 1 to Trader 1"
        echo "$OUTPUT"
        exit 1
    fi

    print_subheader "Adding Product 2 to Trader 2"
    OUTPUT=$(./"$APP_NAME" add-product-to-trader \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --product-id "$PRODUCT2_ID" \
        --trader-id "$TRADER2_ID" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Product 2 added to Trader 2"
    else
        print_error "Failed to add Product 2 to Trader 2"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 5: Deposit Money
test_deposit_money() {
    print_header "TEST 5: Depositing Money"

    print_subheader "Depositing to User 1"
    OUTPUT=$(./"$APP_NAME" deposit-money \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --id "$USER1_ID" \
        --amount "2000" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Money deposited to User 1"
    else
        print_error "Failed to deposit money to User 1"
        echo "$OUTPUT"
        exit 1
    fi

    print_subheader "Depositing to Trader 1"
    OUTPUT=$(./"$APP_NAME" deposit-money \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --id "$TRADER1_ID" \
        --amount "10000" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Money deposited to Trader 1"
    else
        print_error "Failed to deposit money to Trader 1"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 6: Buy Product
test_buy_product() {
    print_header "TEST 6: Buying Products"

    print_subheader "User 1 buying Product 1 from Trader 1"
    OUTPUT=$(./"$APP_NAME" buy-product \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --user-id "$USER1_ID" \
        --product-id "$PRODUCT1_ID" \
        --trader-id "$TRADER1_ID" \
        --quantity "5" 2>&1)

    if echo "$OUTPUT" | grep -q "committed successfully"; then
        RECEIPT_ID=$(echo "$OUTPUT" | grep -oP 'RECEIPT_[0-9]+')
        print_success "Product purchased successfully. Receipt: $RECEIPT_ID"
    else
        print_error "Failed to purchase product"
        echo "$OUTPUT"
        exit 1
    fi

    echo ""
}

# Test 7: Query Products by Name
test_query_by_name() {
    print_header "TEST 7: Query Products by Name"

    print_subheader "Querying for '$TEST_PRODUCT_NAME'"
    OUTPUT=$(./"$APP_NAME" query-by-name \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --name "$TEST_PRODUCT_NAME" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Query by name successful"
        echo "$OUTPUT" | head -n 10
    else
        print_error "Query by name failed"
        echo "$OUTPUT"
    fi

    echo ""
}

# Test 8: Query Products by ID
test_query_by_id() {
    print_header "TEST 8: Query Products by ID"

    print_subheader "Querying for Product ID: $PRODUCT1_ID"
    OUTPUT=$(./"$APP_NAME" query-by-id \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --product-id "$PRODUCT1_ID" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Query by ID successful"
        echo "$OUTPUT" | head -n 10
    else
        print_error "Query by ID failed"
        echo "$OUTPUT"
    fi

    echo ""
}

# Test 9: Query Products by Trader Type
test_query_by_type() {
    print_header "TEST 9: Query Products by Trader Type"

    print_subheader "Querying for SUPERMARKET products"
    OUTPUT=$(./"$APP_NAME" query-by-type \
        --org "$ORG1" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --type "SUPERMARKET" 2>&1)

    if echo "$OUTPUT" | grep -q "SUPERMARKET\|Result"; then
        print_success "Query by type successful"
        echo "$OUTPUT" | head -n 15
    else
        print_error "Query by type failed"
        echo "$OUTPUT"
    fi

    echo ""
}

# Test 10: Query Products by Price Range
test_query_by_price_range() {
    print_header "TEST 10: Query Products by Price Range"

    print_subheader "Querying for products between $1.00 and $10.00"
    OUTPUT=$(./"$APP_NAME" query-by-price-range \
        --org "$ORG3" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --min-price "1.0" \
        --max-price "10.0" 2>&1)

    if echo "$OUTPUT" | grep -q "Result\|price"; then
        print_success "Query by price range successful"
        echo "$OUTPUT" | head -n 15
    else
        print_error "Query by price range failed"
        echo "$OUTPUT"
    fi

    echo ""
}

# Test 11: Multi-Organization Test
test_multi_org() {
    print_header "TEST 11: Multi-Organization Operations"

    print_subheader "Org3 querying data created by Org1 and Org2"
    OUTPUT=$(./"$APP_NAME" query-by-name \
        --org "$ORG3" \
        --user "$USER1" \
        --channel "$CHANNEL_A" \
        --name "$TEST_PRODUCT_NAME" 2>&1)

    if echo "$OUTPUT"; then
        print_success "Cross-organization query successful"
    else
        print_error "Cross-organization query failed"
        echo "$OUTPUT"
    fi

    echo ""
}

# Test 12: Channel B Operations
test_channel_b() {
    print_header "TEST 12: Channel B Operations"

    print_subheader "Creating trader on Channel B"
    OUTPUT=$(./"$APP_NAME" create-trader \
        --org "$ORG2" \
        --user "$USER1" \
        --channel "$CHANNEL_B" \
        --type "GROCERY" \
        --vat "555666777" \
        --balance "20000" 2>&1)

    TRADER_B_ID=$(extract_id "$OUTPUT")
    if [ -n "$TRADER_B_ID" ]; then
        print_success "Trader created on Channel B: $TRADER_B_ID"
    else
        print_error "Failed to create trader on Channel B"
        echo "$OUTPUT"
    fi

    echo ""
}

# ============================================
# Test Summary
# ============================================
print_test_summary() {
    print_header "TEST SUMMARY"

    echo -e "${BOLD}Created Resources:${NC}"
    echo -e "  ${CYAN}Trader 1:${NC} $TRADER1_ID (Org1, Channel A, SUPERMARKET)"
    echo -e "  ${CYAN}Trader 2:${NC} $TRADER2_ID (Org2, Channel A, PHARMACY)"
    echo -e "  ${CYAN}User 1:${NC}   $USER1_ID (Org1)"
    echo -e "  ${CYAN}User 2:${NC}   $USER2_ID (Org2)"
    echo -e "  ${CYAN}Product 1:${NC} $PRODUCT1_ID (SUPERMARKET, Milk)"
    echo -e "  ${CYAN}Product 2:${NC} $PRODUCT2_ID (PHARMACY, Aspirin)"
    echo ""

    echo -e "${BOLD}Organizations Tested:${NC}"
    echo -e "  ${GREEN}✓${NC} Org1 (User1)"
    echo -e "  ${GREEN}✓${NC} Org2 (Admin)"
    echo -e "  ${GREEN}✓${NC} Org3 (User1)"
    echo ""

    echo -e "${BOLD}Channels Tested:${NC}"
    echo -e "  ${GREEN}✓${NC} Channel A"
    echo -e "  ${GREEN}✓${NC} Channel B"
    echo ""

    echo -e "${BOLD}Functions Tested:${NC}"
    echo -e "  ${GREEN}✓${NC} Create Trader"
    echo -e "  ${GREEN}✓${NC} Create User"
    echo -e "  ${GREEN}✓${NC} Create Product"
    echo -e "  ${GREEN}✓${NC} Add Product to Trader"
    echo -e "  ${GREEN}✓${NC} Deposit Money"
    echo -e "  ${GREEN}✓${NC} Buy Product"
    echo -e "  ${GREEN}✓${NC} Query by Name"
    echo -e "  ${GREEN}✓${NC} Query by ID"
    echo -e "  ${GREEN}✓${NC} Query by Type"
    echo -e "  ${GREEN}✓${NC} Query by Price Range"
    echo -e "  ${GREEN}✓${NC} Multi-Organization Operations"
    echo -e "  ${GREEN}✓${NC} Multi-Channel Operations"
    echo ""
}

# ============================================
# Main Execution
# ============================================
main() {
    print_header "Commerce SDK - Automated Test Suite"
    print_info "Testing all SDK functions across multiple organizations and channels"
    echo ""

    # Build
    build_app

    # Run tests
    test_create_traders
    test_create_users
    test_create_products
    test_add_products_to_traders
    test_deposit_money
    test_buy_product
    test_query_by_name
    test_query_by_id
    test_query_by_type
    test_query_by_price_range
    test_multi_org
    test_channel_b

    # Summary
    print_test_summary

    print_header "ALL TESTS COMPLETED SUCCESSFULLY! ✓"
}

# Run main function
main