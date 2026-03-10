# Commerce Blockchain Trading System

A Hyperledger Fabric-based blockchain application for managing peer-to-peer commerce transactions with multiple trader types, products, and users across distributed organizations.

**Course:** PDASP 2024/25 | **Faculty:** Faculty of Technical Sciences  
**Author:** Mili Bovan E2 163/2024 

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Features & Commands](#features--commands)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Network Configuration](#network-configuration)
- [Known Issues](#known-issues)

---

## Project Overview

This project implements a complete blockchain-based trading system on Hyperledger Fabric 2.2.6+ that enables:

- **Multi-organization commerce** across 3 organizations (Org1, Org2, Org3)
- **Trader management** supporting multiple trader types (Supermarket, Pharmacy, Car Dealer, Grocery, Gas Station)
- **Product catalog** with inventory management, pricing, and expiry tracking
- **User accounts** with balance management and transaction history
- **Transaction processing** including product purchases, money deposits, and receipt generation
- **Rich querying** using CouchDB for complex product searches across multiple criteria

### Key Features

✓ Multi-channel support (channel-a, channel-b)  
✓ Cross-organization transactions with proper access control  
✓ Complete audit trail via blockchain receipts  
✓ Real-time balance updates and inventory management  
✓ Advanced CouchDB queries for product filtering  
✓ Both interactive CLI and programmatic interfaces  

---

## Architecture

### Network Topology

```
┌─────────────────────────────────────────────────┐
│          Hyperledger Fabric Network             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Org1   │  │   Org2   │  │   Org3   │     │
│  │ (Port 7) │  │ (Port 9) │  │ (Port 8) │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │           │
│  ┌────┴─────────────┴─────────────┴────┐      │
│  │      channel-a & channel-b          │      │
│  │  (All peers on both channels)       │      │
│  └─────────────────────────────────────┘      │
│       │                                       │
│  ┌────┴────────────────────────┐             │
│  │   Ordering Service (RAFT)   │             │
│  │  - Batch size: 2 TXs        │             │
│  │  - Batch timeout: 1 second  │             │
│  └─────────────────────────────┘             │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  State Database (CouchDB)    │            │
│  │  - JSON documents            │            │
│  │  - Rich queries              │            │
│  └──────────────────────────────┘            │
└─────────────────────────────────────────────────┘
```

### Organizations & Identities

| Organization | Peer | Port | Users | CA |
|---|---|---|---|---|
| **Org1** | peer0.org1.example.com | 7051 | User1, Admin | ca.org1 |
| **Org2** | peer0.org2.example.com | 9051 | User1, Admin | ca.org2 |
| **Org3** | peer0.org3.example.com | 8051 | User1, Admin | ca.org3 |

---

## Prerequisites

### System Requirements

- **OS:** Linux, macOS, or WSL2 on Windows
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Go:** 1.19+ (for building SDK and chaincode)
- **Git:** 2.0+

### Software Versions

- **Hyperledger Fabric:** 2.5.x (tested with 2.5.4)
- **CouchDB:** 3.2.x
- **Go SDK:** github.com/hyperledger/fabric-gateway v1.2+

### Port Requirements

Ensure these ports are available:
- 7051, 7052, 7053 (Org1 peer, chaincode, events)
- 9051, 9052, 9053 (Org2 peer, chaincode, events)
- 8051, 8052, 8053 (Org3 peer, chaincode, events)
- 7054, 9054, 8054 (CAs)
- 6007, 6009, 6008 (CouchDB for Org1, Org2, Org3)
- 7050 (Orderer)

---

## Installation & Setup

### Prerequisites Verification

Before starting, ensure you have:

```bash
# Check peer binaries
peer version

# Check fabric-ca
fabric-ca-client version

# Check docker and docker-compose
docker --version
docker-compose --version
```

### 1. Clone Repository

```bash
git clone https://github.com/milibovan/hyperledger-commerce-chain
cd commerce-blockchain/network
```

### 2. Generate Crypto Material with Fabric CA

The network uses **Fabric Certificate Authorities (CA)** instead of `cryptogen`. This is more flexible for production environments.

```bash
# The network automatically generates crypto materials via CA when starting
# Ensure compose files are in the compose/ subdirectory
ls compose/compose-ca.yaml compose-network.yaml compose-couchdb.yaml
```

### 3. Start the Fabric Network

```bash
# Make start-network.sh executable
chmod +x start-network.sh

# Start the network (this brings up all containers: peers, orderers, CAs, CouchDB)
./start-network.sh up

# Verify all containers are running
docker ps | grep hyperledger
```

**Expected Containers:**
- 9 Peer containers (3 per organization × 3 organizations)
- 3 Orderer containers (raft0, raft1, raft2)
- 4 Fabric CA containers (1 per org + 1 orderer)
- 9 CouchDB containers (1 per peer)

### 4. Create Channels

```bash
# Create both channel-a and channel-b
./start-network.sh createChannel

# Verify channels were created
docker exec peer0.org1.example.com peer channel list
```

### 5. Deploy Chaincode

```bash
# Deploy chaincode to both channels
# This packages, installs, approves, and commits the chaincode
./start-network.sh deployCC

# Verify chaincode is installed
docker exec peer0.org1.example.com peer lifecycle chaincode queryinstalled
```

### 6. Build Client Application

```bash
cd ../app
go mod download
go build -o commerce-app

# Verify build
./commerce-app --help
```

---

## Running the Application

### Interactive Mode

```bash
./run-app.sh
```

This launches the interactive menu where you can:
1. Select organization (Org1, Org2, Org3)
2. Select user identity (User1, Admin)
3. Select channel (channel-a, channel-b)
4. Choose invoke or query operations

### CLI Mode

Run commands directly without the menu:

```bash
# Create a trader
./commerce-app create-trader \
  --org org1 \
  --user User1 \
  --channel channel-a \
  --type SUPERMARKET \
  --vat 123456789 \
  --balance 50000

# Create a user
./commerce-app create-user \
  --org org1 \
  --user User1 \
  --channel channel-a \
  --name Alice \
  --surname Smith \
  --email alice@example.com \
  --balance 5000

# Query products by type
./commerce-app query-by-type \
  --org org1 \
  --user User1 \
  --channel channel-a \
  --type SUPERMARKET
```

---

## Features & Commands

### Invoke Operations (State-Changing Transactions)

#### Create Trader
```bash
create-trader --type SUPERMARKET --vat <vat-id> --balance <amount>
```
Creates a new trader entity with initial balance. Trader types:
- SUPERMARKET
- PHARMACY
- CARDEALER
- GROCERY
- GAS_STATON

#### Create User
```bash
create-user --name <name> --surname <surname> --email <email> --balance <amount>
```
Creates a user account with email and initial balance.

#### Create Product
```bash
create-product \
  --name <product-name> \
  --expiry "YYYY-MM-DD HH:MM:SS" \
  --price <price> \
  --quantity <qty> \
  --type <trader-type>
```
Creates a product (automatically assigned to a trader type).

#### Add Product to Trader
```bash
add-product-to-trader --product-id PRODUCT_xxx --trader-id TRADER_xxx
```
Associates a product with a trader's inventory.

#### Buy Product
```bash
buy-product \
  --user-id USER_xxx \
  --product-id PRODUCT_xxx \
  --trader-id TRADER_xxx \
  --quantity <qty>
```
Executes a purchase, transferring funds and creating a receipt.

#### Deposit Money
```bash
deposit-money --id <USER_xxx or TRADER_xxx> --amount <amount>
```
Adds funds to a user or trader account.

### Query Operations (Read-Only)

#### Query by Name
```bash
query-by-name --name "Milk"
```

#### Query by ID
```bash
query-by-id --product-id PRODUCT_xxx
```

#### Query by Trader Type
```bash
query-by-type --type SUPERMARKET
```

#### Query by Price Range
```bash
query-by-price-range --min-price 1.0 --max-price 10.0
```

#### Query by Multiple Categories
```bash
query-by-multiple \
  --name "Milk" \
  --type SUPERMARKET \
  --product-id PRODUCT_xxx \
  --price 5.0
```

#### Query by Multiple Categories with Price Range
```bash
query-by-multiple-range \
  --name "Aspirin" \
  --type PHARMACY \
  --min-price 1.0 \
  --max-price 15.0
```

---

## Testing

### Run Automated Test Suite

```bash
cd app
./test-script.sh
```

The test suite performs:

1. **Trader Creation** - Creates traders across organizations
2. **User Creation** - Sets up test users
3. **Product Management** - Creates and inventories products
4. **Transactions** - Deposits funds and processes purchases
5. **Queries** - Tests all query functions
6. **Cross-org Operations** - Verifies multi-organization data sharing
7. **Multi-channel** - Validates operations on both channels

**Expected Duration:** 2-3 minutes  
**Expected Result:** All tests pass with block confirmations

### Test Single Operation

```bash
./test-one-case.sh
```

Useful for debugging specific functionality.

### Manual Testing

See [Interactive Mode](#interactive-mode) above.

---

## Project Structure

```
commerce-blockchain/
├── network/
│   ├── docker-compose.yaml          # Fabric network definition
│   ├── configtx.yaml                # Channel configuration
│   ├── crypto-config.yaml           # Organization structure
│   ├── generate-certs.sh            # Crypto material generation
│   ├── create-channels.sh           # Channel creation
│   └── organizations/
│       └── peerOrganizations/
│           ├── org1.example.com/
│           ├── org2.example.com/
│           └── org3.example.com/
│
├── chaincode/
│   ├── go.mod                       # Go module definition
│   ├── main.go                      # Chaincode entry point
│   ├── smart_contract.go            # Core business logic
│   ├── creates.go                   # Create operations
│   ├── reads.go                     # Read operations
│   ├── queries.go                   # Query functions
│   ├── iterator_helpers.go          # Result processing
│   └── structs/
│       └── data.go                  # Data structures
│
├── app/
│   ├── go.mod                       # Application module
│   ├── go.sum                       # Dependency lock
│   ├── main.go                      # CLI entry point
│   ├── handleCLI.go                 # Command parsing
│   ├── invokeFunctionsMenus.go      # Interactive invoke menu
│   ├── queryFunctionsMenus.go       # Interactive query menu
│   ├── client/
│   │   ├── gateway.go               # Fabric gateway connection
│   │   └── contract.go              # Chaincode wrappers
│   ├── run-app.sh                   # Launch interactive mode
│   ├── test-script.sh               # Full test suite
│   └── test-one-case.sh             # Single test
│
└── README.md                        # This file
```

---

## Network Configuration

### Ordering Service (RAFT Consensus)

The network uses **RAFT consensus** with 3 orderer nodes for fault tolerance:

| Orderer | Port | Admin Port | Operations Port | Status |
|---------|------|-----------|-----------------|--------|
| raft0.example.com | 7050 | 7053 | 9443 | Leader eligible |
| raft1.example.com | 11111 | 7554 | 9777 | Follower |
| raft2.example.com | 7052 | 7058 | 7154 | Follower |

**Batch Configuration:**
- **Batch Size:** Minimum 2 transactions
- **Batch Timeout:** 1 second
- **Consensus:** RAFT with automatic leader election
- **Max Message Count:** 2 transactions per block
- **Preferred Max Bytes:** 512 KB per block

This ensures blocks are created either when 2 transactions accumulate OR after 1 second, whichever comes first.

### Peer Organizations (9 Peers Total)

**Organization 1 (Org1MSP)**
- peer0.org1.example.com: 7051 (Chaincode: 7052)
- peer1.org1.example.com: 7151 (Chaincode: 7152)
- peer2.org1.example.com: 7251 (Chaincode: 7252)
- CouchDB Instances: couchdb0 (5984), couchdb3 (5987), couchdb6 (5990)

**Organization 2 (Org2MSP)**
- peer0.org2.example.com: 9051 (Chaincode: 9052)
- peer1.org2.example.com: 9151 (Chaincode: 9152)
- peer2.org2.example.com: 9251 (Chaincode: 9252)
- CouchDB Instances: couchdb1 (5985), couchdb4 (5988), couchdb7 (5991)

**Organization 3 (Org3MSP)**
- peer0.org3.example.com: 8051 (Chaincode: 8052)
- peer1.org3.example.com: 8151 (Chaincode: 8152)
- peer2.org3.example.com: 8251 (Chaincode: 8252)
- CouchDB Instances: couchdb2 (5986), couchdb5 (5989), couchdb8 (5992)

**Fabric CA Servers**
- ca.orderer.example.com: 7054
- ca.org1.example.com: 7055
- ca.org2.example.com: 7056
- ca.org3.example.com: 7057

### Channels

Both channels support all 3 organizations with identical configuration:

```
channel-a:
  ├── Org1MSP (3 peers)
  ├── Org2MSP (3 peers)
  └── Org3MSP (3 peers)

channel-b:
  ├── Org1MSP (3 peers)
  ├── Org2MSP (3 peers)
  └── Org3MSP (3 peers)
```

**Endorsement Policy:** `AND('Org1MSP.peer', 'Org2MSP.peer', 'Org3MSP.peer')`
All three organizations must endorse transactions.

### State Database Configuration

**Database:** CouchDB (JSON-based)  
**Username:** admin  
**Password:** password

**CouchDB Indexes:**
```json
{
  "index": {
    "fields": [
      "doc-type",
      "expiry-date",
      "quantity",
      "price",
      "trader-type"
    ]
  },
  "ddoc": "indexProductDoc",
  "name": "indexProduct",
  "type": "json"
}
```

### TLS Configuration

All communications use TLS 1.2 (or higher):
- **Peer TLS:** Enabled
- **Orderer TLS:** Enabled
- **CA TLS:** Enabled (default port 7054)
- **Mutual TLS:** Supported but not required for client connections

Certificates are automatically generated and managed by Fabric CAs during network initialization.

---

## CouchDB Rich Queries

The application leverages CouchDB's query capabilities for complex product searches:

### Example: Multi-field Query
```sql
{
  "selector": {
    "doc-type": "product",
    "trader-type": "PHARMACY",
    "price": {"$lte": 10.0},
    "name": {"$eq": "Aspirin"}
  }
}
```

### Why CouchDB Over LevelDB?

| Feature | CouchDB | LevelDB |
|---------|---------|---------|
| JSON Queries | ✓ | ✗ |
| Multi-field Filters | ✓ | ✗ |
| Price Range Queries | ✓ | Requires custom code |
| Complex Logic | ✓ | Manual iteration |
| Indexes | ✓ | Basic |

---

## Data Models

### Trader
```json
{
  "doc-type": "trader",
  "id": "TRADER_1760649000000000000",
  "trader-type": "SUPERMARKET",
  "vat": "123456789",
  "products-available-ids": ["PRODUCT_1", "PRODUCT_2"],
  "receipts-ids": ["RECEIPT_1"],
  "balance": 50000.0
}
```

### User
```json
{
  "doc-type": "user",
  "id": "USER_1760649000000000000",
  "name": "Alice",
  "surname": "Smith",
  "email": "alice@example.com",
  "receipts-ids": ["RECEIPT_1"],
  "balance": 5000.0
}
```

### Product
```json
{
  "doc-type": "product",
  "id": "PRODUCT_1760649000000000000",
  "name": "Milk 1L",
  "price": 1.25,
  "quantity": 150,
  "expiry-date": "2025-12-31T00:00:00Z",
  "trader-type": "SUPERMARKET"
}
```

### Receipt
```json
{
  "doc-type": "receipt",
  "id": "RECEIPT_1760649000000000000",
  "trader-id": "TRADER_xxx",
  "user-id": "USER_xxx",
  "products-ids": ["PRODUCT_1", "PRODUCT_2"],
  "date": "2025-06-30T15:43:32Z"
}
```

---

## Error Handling

The application properly handles:

- ❌ Duplicate entity IDs
- ❌ Insufficient user balance
- ❌ Product not found / out of stock
- ❌ Organization/channel mismatches
- ❌ Invalid input formats
- ❌ Certificate/authentication failures
- ❌ Endorsement policy failures

All errors are logged with descriptive messages.

---

## Known Issues

### Issue 1: Date Format in CLI
**Problem:** Date must include time in format `YYYY-MM-DD HH:MM:SS`  
**Solution:** Use full timestamp when creating products  
**Status:** ⚠️ Requires user input validation improvement

### Issue 2: Cross-organization Write Access
**Problem:** Org3 can only read, not write certain data  
**Expected:** Current endorsement policy requires all 3 orgs  
**Status:** ✓ By design

### Issue 3: Receipt ID Extraction in Scripts
**Problem:** Receipt IDs not extracting properly in older test versions  
**Solution:** Updated test-script.sh with proper regex patterns  
**Status:** ✓ Fixed

---

## Stopping the Network

To stop and clean up the network:

```bash
# Stop all running containers
./start-network.sh down

# Verify containers are stopped
docker ps | grep hyperledger  # Should return nothing

# Restart the network (removes all state)
./start-network.sh restart
```

### Important Notes:

- `down` mode removes all volumes and artifacts by default
- Use `restart` to bring network down cleanly and then back up
- Ledger state is **always removed** with `down` mode
- To preserve state between restarts, comment out volume removal in start-network.sh

---

## Future Improvements

### 1. Event-Driven Architecture with Apache Kafka

**Use Case:** Real-time transaction notifications and order tracking

```
Blockchain Network → Chaincode Events → Kafka Topics → Services
                                     └─ Order Updates
                                     └─ Payment Confirmations
                                     └─ Inventory Alerts
```

**Implementation:**
- Deploy Kafka cluster alongside Fabric network
- Chaincode emits events on product purchases and deposits
- Kafka consumer applications process events
- Services subscribe to relevant topics (inventory service, notification service, analytics)
- Enable real-time dashboard updates without polling blockchain

**Benefits:**
- Decoupled services architecture
- Scalable event distribution
- Replay event history for analytics
- Integration point for external systems

---

### 2. React Frontend Application

**Current State:** CLI-only interface  
**Proposed:** Full-stack web application

**Frontend Features:**
```
Dashboard
├── Trader Management
│   ├── Create/edit traders
│   ├── View inventory
│   └── Monitor sales
├── Product Catalog
│   ├── Search/filter products
│   ├── Price comparison
│   └── Stock levels
├── User Accounts
│   ├── Balance management
│   ├── Transaction history
│   ├── Receipt management
│   └── Purchase analytics
└── Admin Panel
    ├── Network statistics
    ├── Block explorer
    └── User management
```

**Tech Stack:**
- React 18+ with TypeScript
- Redux or Zustand for state management
- Material-UI or Tailwind CSS for styling
- WebSocket for real-time updates
- Chart.js for analytics visualizations

**Architecture:**
```
React Frontend
    ↓
REST API Gateway (Node.js/Express)
    ↓
Fabric SDK (Go or Node.js)
    ↓
Blockchain Network
```

---

### 3. REST API Gateway

**Purpose:** Decouple frontend from SDK complexity

**Endpoints:**
```
POST   /api/traders                  # Create trader
GET    /api/traders/:id              # Get trader details
GET    /api/products?type=PHARMACY   # Query products
POST   /api/purchases                # Buy product
POST   /api/deposits                 # Deposit money
GET    /api/receipts/:userId         # Get receipts
```

**Benefits:**
- Frontend agnostic (can swap frameworks)
- SDK version updates don't break frontend
- Caching layer for frequently accessed data
- Rate limiting and authentication

---

### 4. Database Caching Layer

**Use Case:** Reduce blockchain query load

**Implementation:**
```
Redis Cache
├── Product catalog (frequently accessed)
├── Trader profiles
├── Price aggregates
└── Query results (TTL: 1-5 minutes)

MongoDB (Optional)
├── Full transaction history
├── Analytics data
└── Audit logs
```

**Flow:**
1. Frontend requests product data
2. API checks Redis cache
3. Cache miss → Query blockchain
4. Store result in Redis for 5 minutes
5. Next requests use cache

---

### 5. Multi-Channel Product Synchronization

**Current State:** Two independent channels  
**Proposed:** Cross-channel product catalog

**Use Case:** 
- channel-a: Primary commerce (all products)
- channel-b: Wholesale/bulk orders
- Sync product updates between channels

**Implementation:**
- Chaincode listener on channel-a for product changes
- Kafka event → Channel-b update
- Atomic cross-channel transactions
- Product availability synchronization

---

### 6. Advanced Analytics & Reporting

**Real-time Dashboards:**
```
Sales Analytics
├── Revenue by trader type
├── Top selling products
├── Customer behavior patterns
└── Inventory turnover

Blockchain Metrics
├── Transaction throughput
├── Block times
├── Network latency
├── Endorsement policy compliance
```

**Data Pipeline:**
```
Blockchain Events → Kafka → Apache Spark → Analytics DB → Grafana Dashboards
```

---

### 7. Mobile Application

**Native Mobile App** (React Native or Flutter)

**Features:**
- QR code payment scanning
- One-tap purchases
- Push notifications for orders
- Biometric authentication
- Offline capabilities with sync

---

### 8. Supply Chain Visibility

**Enhancement:** Track product origin and movement

**Fields to Add:**
```json
Product {
  "origin_trader": "TRADER_xxx",
  "current_location": "warehouse_A",
  "temperature_log": [...],
  "custody_chain": [
    {"trader": "TRADER_1", "timestamp": "...", "action": "manufactured"},
    {"trader": "TRADER_2", "timestamp": "...", "action": "received"}
  ]
}
```

**Benefits:**
- Product authenticity verification
- Recall management
- Compliance documentation
- Quality assurance

---

### 9. Payment Gateway Integration

**Real-World Payments:**
```
Blockchain Commerce ← Stripe/PayPal API → External Payments
    ↓
    ├─ Fiat currency (USD, EUR)
    ├─ Cryptocurrency (USDC stablecoin)
    └─ Digital wallets (Apple Pay, Google Pay)
```

**Flow:**
1. User initiates purchase in React app
2. Frontend sends payment request to gateway
3. Gateway processes payment
4. On success → Trigger blockchain transaction
5. Receipt generated on chain

---

### 10. Regulatory Compliance Features

**Tax & Audit:**
- Automatic tax calculation by jurisdiction
- Audit trail for regulatory bodies
- GDPR-compliant data retention
- Compliance reports generation

**Blockchain Benefits:**
- Immutable transaction records
- Real-time audit capability
- Cross-org transparency for compliance

---

### 11. Organizational Onboarding Flow

**Current:** Manual setup  
**Proposed:** Self-service onboarding

**Features:**
- New organization applies for network access
- Admin approval workflow
- Automated Fabric CA enrollment
- Certificate distribution
- Network orientation

---

### 12. Interoperability with Other Blockchains

**Use Case:** Settle with external blockchain networks

```
Hyperledger Fabric       Ethereum
    ├─ Settle X units    ├─ Pay in ETH
    ├─ Atomic swap       ├─ Smart contract
    └─ Cross-chain lock  └─ Hash time-lock contract
```

**Implementation:**
- HTLC (Hash Time-Locked Contracts)
- Relay chain bridges
- Notarization service

---

### Implementation Priority

**Phase 1 (Immediate):**
- React Frontend
- REST API Gateway
- Redis Caching

**Phase 2 (Medium-term):**
- Kafka Event System
- Analytics Dashboard
- Mobile App

**Phase 3 (Long-term):**
- Payment Gateway Integration
- Supply Chain Enhancements
- Cross-blockchain Interop

---

---

## Architecture Decision: Why These Choices?

### Fabric CA vs Cryptogen

- **Chosen:** Fabric Certificate Authority (CA)
- **Why:** More realistic for enterprise; supports dynamic enrollment; easier to manage multiple identities; automatable credential issuance
- **Trade-off:** Requires CA containers to be running; slightly more setup complexity

### RAFT Consensus (3 Orderers)

- **Chosen:** etcdraft with 3 nodes
- **Why:** Crash Fault Tolerant (CFT); leader election is automatic; simple to understand; production-ready
- **Alternative rejected:** BFT (would require 4+ nodes for same fault tolerance)

### CouchDB State Database

- **Chosen:** CouchDB (1 instance per peer)
- **Why:** Rich queries with JSON filters; indexed field searches; complex product queries possible; industry standard
- **Trade-off:** More memory/disk than LevelDB; requires container per peer
- **Why better than LevelDB:** See [CouchDB Rich Queries](#couchdbrich-queries) section

### 9 Peers (3 per Organization)

- **Chosen:** 3 peers × 3 organizations = 9 peers
- **Why:** Provides redundancy within each org; demonstrates high availability; realistic for enterprise
- **Scalability:** Easy to add/remove peers by updating compose files

### Endorsement Policy: All 3 Organizations

- **Chosen:** `AND('Org1MSP.peer', 'Org2MSP.peer', 'Org3MSP.peer')`
- **Why:** Demonstrates multi-org governance; all participants must agree on transactions
- **Trade-off:** Slower than single-org; requires network latency
- **Business value:** Immutability; no single org can alter history

---

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Gateway SDK for Go](https://github.com/hyperledger/fabric-gateway)
- [CouchDB Query Syntax](https://docs.couchdb.org/en/stable/api/database/find.html)
- [RAFT Consensus in Fabric](https://hyperledger-fabric.readthedocs.io/en/release-2.5/orderer/ordering_service.html)
- Project Specification: PDASP_24_25_projekat.pdf

---

## Repository Information

**Repository:** (https://github.com/milibovan/hyperledger-commerce-chain) 
**License:** MIT License (Free/Open Source)  
**Team Members:** Mili Bovan E2 163/2024
**Course:** PDASP 2024/25  
**Institution:** Faculty of Technical Sciences Novi Sad

---

## License

This project is licensed under the **MIT License** - see LICENSE file for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...

See LICENSE file for full text.
```

---

**Last Updated:** November 2025  
**Fabric Version:** 2.5.x  
**Status:** ✓ Production-Ready Test Network
