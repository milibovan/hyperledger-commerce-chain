import requests
import json

# Common headers for all requests
headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Origin': 'http://localhost:5173'
}

# The list of POST requests extracted from your HAR file
requests_data = [
    {
        "url": "http://localhost:8080/product/channel-a",
        "name": "Create Product 1",
        "data": {
            "trader-type": "SUPERMARKET",
            "expiry-date": "2026-01-10 20:01:26",
            "quantity": 10,
            "price": 100,
            "name": "Some product"
        }
    },
    {
        "url": "http://localhost:8080/product/channel-a",
        "name": "Create Product 2",
        "data": {
            "trader-type": "SUPERMARKET",
            "expiry-date": "2026-01-09 20:01:52",
            "quantity": 50,
            "price": 10,
            "name": "Some product 1"
        }
    },
    {
        "url": "http://localhost:8080/product/channel-a",
        "name": "Create Product 3",
        "data": {
            "trader-type": "SUPERMARKET",
            "expiry-date": "2026-01-21 20:02:17",
            "quantity": 100,
            "price": 1,
            "name": "Some product 2"
        }
    },
    {
        "url": "http://localhost:8080/user/channel-a",
        "name": "Create User",
        "data": {
            "name": "Mili",
            "surname": "Bovan",
            "email": "milibovan190d@gmail.com",
            "balance": 1000
        }
    },
    {
        "url": "http://localhost:8080/trader/channel-a",
        "name": "Create Trader 1",
        "data": {
            "name": "Some_trader",
            "trader-type": "SUPERMARKET",
            "vat": "some_vat",
            "balance": 1000,
            "channel": "channel-a"
        }
    },
    {
        "url": "http://localhost:8080/trader/channel-a",
        "name": "Create Trader 2",
        "data": {
            "name": "Some_trader_1",
            "trader-type": "SUPERMARKET",
            "vat": "some_vat_1",
            "balance": 500,
            "channel": "channel-a"
        }
    }
]

print("Starting execution of 6 POST requests...\n")

for req in requests_data:
    try:
        response = requests.post(req["url"], headers=headers, json=req["data"])

        status_symbol = "✅" if response.status_code in [200, 201] else "❌"
        print(f"{status_symbol} {req['name']} | Status: {response.status_code}")

        # Optional: Print response body if there is an error
        if response.status_code not in [200, 201]:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ {req['name']} | Failed to connect: {str(e)}")

print("\nFinished.")