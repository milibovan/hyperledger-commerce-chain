#!/bin/bash

ORG1="org1"
ORG2="org2"
ORG3="org3"
USER1="User1"
ADMIN="Admin"
CHANNEL_A="channel-a"
CHANNEL_B="channel-b"

echo "Building..."
go build -o commerce-app

echo ""
echo "Running command..."

# Add current time to expiry date
EXPIRY_WITH_TIME="2025-06-30 15:43:32"

OUTPUT=$(./commerce-app create-product \
        --org "$ORG2" \
        --user "$ADMIN" \
        --channel "$CHANNEL_A" \
        --name "Aspirin" \
        --expiry "$EXPIRY_WITH_TIME" \
        --price "5.99" \
        --quantity "200" \
        --type "PHARMACY" 2>&1)

echo "=== RAW OUTPUT ==="
echo "$OUTPUT"
echo "=================="

echo ""
echo "=== TRYING TO EXTRACT ID ==="
# Try pattern 1
ID1=$(echo "$OUTPUT" | grep -oP 'ID=\K[^ ,]+')
echo "Pattern 'ID=XXX': '$ID1'"

# Try pattern 2
ID2=$(echo "$OUTPUT" | grep -oP '(?:with ID |ID )\K[A-Z_0-9]+')
echo "Pattern 'with ID XXX': '$ID2'"

# Try pattern 3
ID3=$(echo "$OUTPUT" | grep -oP 'PRODUCT_[0-9]+')
echo "Pattern 'PRODUCT_XXX': '$ID3'"