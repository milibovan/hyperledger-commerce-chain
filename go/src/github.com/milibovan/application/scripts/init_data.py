import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:7070"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Origin': 'http://localhost:5173'
}

# Helper function to handle requests and capture IDs
def make_request(method, endpoint, payload, description, id_field_to_capture=None):
    url = f"{BASE_URL}{endpoint}"
    print(f"--- {description} ---")
    try:
        if method == "POST":
            response = requests.post(url, headers=HEADERS, json=payload)
        else:
            response = requests.get(url, headers=HEADERS)

        # Check status code
        if response.status_code not in [200, 201]:
            print(f"❌ Failed | Status: {response.status_code}")
            print(f"   Error: {response.text}")
            sys.exit(1) # Stop script on error

        data = response.json()
        print(f"✅ Success")

        # Dynamic ID Capture
        if id_field_to_capture:
            captured_id = None

            # Strategy 1: Check for direct 'id' field
            if "id" in data:
                captured_id = data["id"]

            # Strategy 2: Parse from 'Message' string (e.g., "Product created 8 PRODUCT_123...")
            # We assume the ID is always the last word in the message string.
            elif "Message" in data:
                try:
                    message_parts = data["Message"].split(" ")
                    if message_parts:
                        captured_id = message_parts[-1] # Take the last part
                except Exception:
                    pass

            if captured_id:
                print(f"   Captured ID: {captured_id}")
                return captured_id
            else:
                print(f"⚠️ Warning: Could not find ID in response.")
                print(f"   Response: {data}")
                return None

        return data

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        sys.exit(1)

print("Starting Dynamic Execution Sequence...\n")

# ==========================================
# PHASE 1: CREATE OBJECTS & CAPTURE IDs
# ==========================================

# 1. Create Product 1
p1_payload = {
    "trader-type": "SUPERMARKET",
    "expiry-date": "2026-01-10 20:01:26",
    "quantity": 10,
    "price": 100,
    "name": "Some product"
}
product_id_1 = make_request("POST", "/product/channel-a", p1_payload, "Creating Product 1", id_field_to_capture=True)

# 2. Create Product 2
p2_payload = {
    "trader-type": "SUPERMARKET",
    "expiry-date": "2026-01-09 20:01:52",
    "quantity": 50,
    "price": 10,
    "name": "Some product 1"
}
product_id_2 = make_request("POST", "/product/channel-a", p2_payload, "Creating Product 2", id_field_to_capture=True)

# 3. Create Product 3
p3_payload = {
    "trader-type": "SUPERMARKET",
    "expiry-date": "2026-01-21 20:02:17",
    "quantity": 100,
    "price": 1,
    "name": "Some product 2"
}
product_id_3 = make_request("POST", "/product/channel-a", p3_payload, "Creating Product 3", id_field_to_capture=True)

# 4. Create User
user_payload = {
    "name": "Mili",
    "surname": "Bovan",
    "email": "milibovan190d@gmail.com",
    "balance": 1000
}
user_id = make_request("POST", "/user/channel-a", user_payload, "Creating User", id_field_to_capture=True)

# 5. Create Trader 1
t1_payload = {
    "name": "Some_trader",
    "trader-type": "SUPERMARKET",
    "email": "milibovan190d@gmail.com",
    "vat": "some_vat",
    "balance": 1000,
    "channel": "channel-a"
}
trader_id_1 = make_request("POST", "/trader/channel-a", t1_payload, "Creating Trader 1", id_field_to_capture=True)

# 6. Create Trader 2
t2_payload = {
    "name": "Some_trader_1",
    "trader-type": "SUPERMARKET",
    "vat": "some_vat_1",
    "email": "josejosemou8@gmail.com",
    "balance": 500,
    "channel": "channel-a"
}
trader_id_2 = make_request("POST", "/trader/channel-a", t2_payload, "Creating Trader 2", id_field_to_capture=True)


# ==========================================
# PHASE 2: EXECUTE TRANSACTIONS (BUYING)
# ==========================================

print("\n---------------------------------------------------")
print("Phase 1 Complete. Starting Transactions with Captured IDs...")
print("---------------------------------------------------\n")

# 7. Add Products to Trader (Trader "Buying" Inventory)
# We use the IDs captured in steps 1, 2, 3, and 5
add_products_payload = {
    "trader-id": trader_id_1,
    "products": [
        {"product-id": product_id_1, "quantity": 4},
        {"product-id": product_id_2, "quantity": 38},
        {"product-id": product_id_3, "quantity": 72}
    ]
}
make_request("POST", "/traders-products/channel-a", add_products_payload, "Adding Products to Trader 1")

# 8. Add Products to Trader (Trader "Buying" Inventory)
# We use the IDs captured in steps 1, 2, 3, and 5
add_products_payload_1 = {
    "trader-id": trader_id_2,
    "products": [
        {"product-id": product_id_1, "quantity": 3},
        {"product-id": product_id_2, "quantity": 12},
        {"product-id": product_id_3, "quantity": 28}
    ]
}
make_request("POST", "/traders-products/channel-a", add_products_payload_1, "Adding Products to Trader 1")

# 9. User Buy Order (User Buying from Trader)
# We use the IDs captured in steps 1, 2, 3, and 4
user_buy_payload = {
    "user-id": user_id,
    "products": [
        {"product-id": product_id_1, "quantity": 3},
        {"product-id": product_id_2, "quantity": 49},
        {"product-id": product_id_3, "quantity": 99}
    ]
}
make_request("POST", "/order/channel-a", user_buy_payload, "User Buying Products")

print("\nAll operations finished successfully.")