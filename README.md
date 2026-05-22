# Commerce Blockchain Trading System

A production-grade, distributed commerce platform built on **Hyperledger Fabric**, extended with a full **ELT data pipeline** (batch + stream), event-driven microservices in **Rust**, and real-time analytics via **Apache Flink**, **HDFS**, **Citus**, and **Apache Superset**.

**Course:** PDASP 2024/25 | **Faculty:** Faculty of Technical Sciences  
**Author:** Mili Bovan E2 163/2024

---

## Table of Contents

- [Project Overview](#project-overview)
- [High-Level Architecture](#high-level-architecture)
- [Infrastructure & Services](#infrastructure--services)
- [ELT Pipeline – Batch Processing](#elt-pipeline--batch-processing)
- [ELT Pipeline – Stream Processing](#elt-pipeline--stream-processing)
- [Data Models & Entity Counts](#data-models--entity-counts)
- [Event System](#event-system)
- [State Machines & Valid Transitions](#state-machines--valid-transitions)
- [Analytics Queries](#analytics-queries)
- [Blockchain Network](#blockchain-network)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Features & Commands](#features--commands)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Known Issues](#known-issues)
- [Future Improvements](#future-improvements)

---

## Project Overview

This system implements a complete, distributed commerce platform with two distinct layers:

**1. Blockchain Layer (Hyperledger Fabric)**
- Multi-organization peer-to-peer commerce across 3 orgs
- Immutable transaction ledger with RAFT consensus
- Smart contract logic for traders, products, users, orders, receipts, and requests
- Rich CouchDB queries for complex product filtering

**2. Data & Analytics Layer (ELT Pipeline)**
- Dual-mode ELT: batch (Airflow + Flink + HDFS + Citus) and stream (Kafka + Flink + HDFS + Citus)
- Faker-based data generators in JavaScript (batch: JSONL files, stream: Avro events)
- Rust microservice producing Avro events to Kafka topics
- Apache Flink jobs for raw → transform → curated zone processing
- 10 batch analytical queries and 5 real-time streaming queries
- Superset dashboard connected to Citus for visualization (in progress)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMERCE PLATFORM                                   │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐  │
│  │ React        │    │  Go Backend  │    │  Hyperledger Fabric Network   │  │
│  │ Frontend     │───▶│  (REST API)  │───▶│  Org1 | Org2 | Org3          │  │
│  └──────────────┘    └──────┬───────┘    │  channel-a | channel-b       │  │
│                             │            └──────────────────────────────┘  │
│                             │ emits events                                  │
│                             ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     KAFKA CLUSTER (3 brokers)                        │  │
│  │   Topics: user | trader | product | order | receipt | request        │  │
│  │   Schema Registry (Avro) | Kafka UI | Email Consumer Service         │  │
│  └──────┬───────────────────────────────────────────┬───────────────────┘  │
│         │ STREAM                                    │ BATCH                 │
│         ▼                                           ▼                       │
│  ┌─────────────────────┐                  ┌────────────────────────┐       │
│  │ Rust Stream         │                  │ JS Faker Scripts       │       │
│  │ Generator           │                  │ → JSONL files          │       │
│  │ (Avro → Kafka)      │                  │ → Volume mount         │       │
│  └────────┬────────────┘                  └──────────┬─────────────┘       │
│           │                                          │                      │
│           ▼                                          ▼                      │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    APACHE FLINK                                    │    │
│  │  Stream: Kafka → HDFS Raw → HDFS Transform (Parquet) → Citus      │    │
│  │  Batch:  Airflow → HDFS Raw → HDFS Transform (Parquet) → Citus    │    │
│  └──────────────────────────┬─────────────────────────────────────────┘    │
│                             │                                               │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                          │
│  ┌─────────────┐   ┌────────────────┐   ┌─────────────────┐               │
│  │ HDFS Raw    │   │ HDFS Transform │   │ Citus (Curated) │               │
│  │ Zone        │   │ Zone (Parquet) │   │ Batch + Stream  │               │
│  └─────────────┘   └────────────────┘   └────────┬────────┘               │
│                                                   │                        │
│                                          ┌────────▼────────┐               │
│                                          │ Apache Superset  │               │
│                                          │ (Visualization)  │               │
│                                          │ [in progress]    │               │
│                                          └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure & Services

| Service | Technology | Role |
|---|---|---|
| `go/` | Go + Fabric SDK | Backend REST API, writes transactions to Hyperledger |
| `frontend/` | React + TypeScript | Web UI for users and traders |
| `kafka1/2/3/` | Apache Kafka | Event broker (3-node cluster) |
| `schemas/` | Avro | Schema definitions for stream and notification events |
| `faker-generators/batch/` | JavaScript | Generates JSONL files for batch ELT |
| `faker-generators/stream/` | JavaScript | Generates random Avro events |
| `faker-generators/stream-generator/` | Rust microservice | Runs JS faker, produces Avro events to Kafka topics |
| `airflow/` | Apache Airflow | Orchestrates batch ingestion jobs (JSONL → HDFS raw) |
| `hdfs/` | HDFS | Raw zone (JSON) and Transform zone (Parquet) for both pipelines |
| `citus/` | Citus (PostgreSQL) | Curated zone — stores results of Flink batch and stream queries |
| `email-service/` | Rust (Kafka consumer) | Sends emails when domain events occur in Kafka |
| `auth-service/` | Rust (planned) | Authentication and authorization microservice |
| `superset/` | Apache Superset | Visualization layer connected to Citus (in progress) |
| Schema Registry | Confluent Schema Registry | Avro schema storage, validation, and evolution |
| Redis | Redis | Caches entity IDs for both batch and stream processes |
| Postgres | PostgreSQL | Logging database |
| pgAdmin | pgAdmin | GUI for Postgres and Citus |
| Kafka UI | Kafka UI | Visual monitoring of Kafka topics and consumers |

### Planned / In Progress

- Kubernetes orchestration
- Persistent Volumes for image storage
- Azure Storage Account
- Azure Container Apps
- GitHub Actions CI/CD
- MongoDB (potential addition)
- Terraform for provision resources on Confluent Cloud and Azure

---

## ELT Pipeline – Batch Processing

The batch pipeline ingests large volumes of pre-generated data through a zoned HDFS architecture into Citus for analytical queries.

```
JS Faker Script
    │
    │  generates JSONL files (one per entity type)
    ▼
Shared Volume (bind-mounted)
    │
    ▼
Apache Airflow
    │  DAG reads JSONL files, writes to HDFS
    ▼
HDFS Raw Zone (JSON, unprocessed)
    │
    ▼
Apache Flink Job #1
    │  transforms raw JSON → Parquet
    ▼
HDFS Transform Zone (Parquet, typed/cleaned)
    │
    ▼
Apache Flink Job #2
    │  runs 10 analytical queries on transform data
    ▼
Citus – Curated Zone (batch results)
    │
    ▼
Apache Superset [in progress]
```

### Batch Entity Counts

```javascript
export const COUNTS = {
    users:    50_000,
    traders:   5_000,
    products: 20_000,
    orders:  500_000,
    receipts: 500_000,
    requests: 100_000,
};
```

---

## ELT Pipeline – Stream Processing

The stream pipeline processes real-time domain events through Kafka and Flink into the same Citus curated zone.

```
JS Faker Script (generates one random Avro event)
    │
    ▼
Rust Stream Generator Microservice
    │  executes JS script, reads output
    │  produces Avro event to Kafka topic (by entity)
    ▼
Kafka Topics (user | trader | product | order | receipt | request)
    │
    ▼
Apache Flink Job #1
    │  Kafka → HDFS Raw Zone
    ▼
HDFS Raw Zone (raw Avro/JSON events)
    │
    ▼
Apache Flink Job #2
    │  Raw → Parquet
    ▼
HDFS Transform Zone (Parquet)
    │
    ▼
Apache Flink Job #3
    │  runs 5 streaming queries, writes results
    ▼
Citus – Curated Zone (streaming results)
    │
    ▼
Apache Superset [in progress]
```

Avro schemas for all stream events are defined in the `schemas/` directory and registered with the Confluent Schema Registry for validation and evolution.

---

## Data Models & Entity Counts

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

## Event System

### Event Types

```javascript
export const EventTypes = Object.freeze({
    UserCreated, UserDeleted,
    TraderCreated, TraderDeleted,
    ProductCreated, ProductDeleted,
    OrderCreated, OrderCompleted, OrderFulfilled, OrderApproved, OrderCancelled,
    ReceiptCreated, ReceiptCancelled,
    RequestCreated, RequestPending, RequestApproved,
    RequestRejected, RequestFulfilled, RequestExpired, RequestCancelled
});
```

### Entity Types
`User | Trader | Product | Order | Receipt | Request`

### Order & Receipt Distributions

Product count per order and quantity per line item are weighted randomly to simulate realistic commerce behaviour:

```javascript
// Products per order (weighted)
numProducts: 1×10, 2×15, 3×20, 4×18, 5×15, 6×10, 7×7, 8×5

// Quantity per line item (weighted)
quantity: 1×40, 2×30, 3×15, 4×10, 5×5
```

---

## State Machines & Valid Transitions

### Order

```
CREATED ──▶ APPROVED ──▶ FULFILLED ──▶ COMPLETED
   │             │
   └─────────────┴──▶ CANCELLED
```

### Receipt

```
CREATED ──▶ CANCELLED
```

### Request

```
CREATED ──▶ PENDING_FUNDS ──▶ APPROVED ──▶ FULFILLED
   │               │               │
   │               ├──▶ REJECTED   └──▶ CANCELLED
   │               ├──▶ EXPIRED
   │               └──▶ CANCELLED
   └──▶ APPROVED (direct)
   └──▶ CANCELLED (direct)
```

---

## Analytics Queries

### Batch Queries (10 — results written to Citus)

1. **Average request fulfillment time** — Calculate average time from request creation to `Fulfilled` status, grouped by trader type involved in the order.

2. **Cumulative expiry loss by week** — Calculate the cumulative value of losses due to product expiry, grouped by trader and week of year.

3. **Multi-category buyers (last 30 days)** — Find users who successfully completed purchases from traders in at least 3 different business categories in the last 30 days.

4. **Monthly basket complexity** — Calculate the monthly average number of receipts generated and total items per order across the entire system.

5. **Near-expiry sales share by week** — Find the share of near-expiry product sales in total sales within that product category, on a weekly basis.

6. **Trader response time ranking** — Rank traders by average response time, measured from order creation to receipt creation.

7. **Monthly product stats** — Calculate average price, average quantity, and average validity period (days from creation to expiry) for products included in orders, grouped by month.

8. **Failed request analysis** — Calculate the average value of failed requests grouped by failure status, trader type, and user.

9. **Weekly inventory value per trader** — Calculate the average total available inventory value (sum of Quantity × Price) for each trader on a weekly basis.

10. **Order complexity distribution** — Calculate the number of distinct products per order, group orders into categories by that count, and show the total and percentage share per category.

### Stream Queries (5 — results written to Citus)

1. **Demand spike detection** — Identify products with the highest activity growth in the last hour.

2. **Fraud detection** — Generate an alert if a single user initiates more than 3 order cancellations within 5 minutes.

3. **Daily completed transaction value** — Calculate the total value of all successfully completed transactions (`Completed` status) within a 24-hour window.

4. **System congestion monitoring** — Track the ratio of newly created/approved orders to fulfilled/completed orders in the last 24 hours.

5. **Whale alert** — Detect and flag any new order whose total value exceeds a defined high threshold (e.g. 10,000 currency units) in real time.

---

## Blockchain Network

### Network Topology

```
┌─────────────────────────────────────────────┐
│          Hyperledger Fabric Network         │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Org1   │  │   Org2   │  │   Org3   │  │
│  │ (Port 7) │  │ (Port 9) │  │ (Port 8) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │         │
│  ┌────┴─────────────┴─────────────┴────┐    │
│  │      channel-a & channel-b          │    │
│  └─────────────────────────────────────┘    │
│       │                                     │
│  ┌────┴────────────────────────┐            │
│  │   Ordering Service (RAFT)   │            │
│  │  3 orderers, batch: 2 TXs   │            │
│  └─────────────────────────────┘            │
│                                             │
│  ┌──────────────────────────────┐           │
│  │  State Database (CouchDB)    │           │
│  │  1 instance per peer         │           │
│  └──────────────────────────────┘           │
└─────────────────────────────────────────────┘
```

### Organizations

| Organization | Peer | Port | Users | CA |
|---|---|---|---|---|
| **Org1** | peer0.org1.example.com | 7051 | User1, Admin | ca.org1 |
| **Org2** | peer0.org2.example.com | 9051 | User1, Admin | ca.org2 |
| **Org3** | peer0.org3.example.com | 8051 | User1, Admin | ca.org3 |

### Ordering Service (RAFT)

| Orderer | Port | Status |
|---|---|---|
| raft0.example.com | 7050 | Leader eligible |
| raft1.example.com | 11111 | Follower |
| raft2.example.com | 7052 | Follower |

Batch size: 2 transactions | Batch timeout: 1 second | Consensus: RAFT with automatic leader election

### Channels

Both channels include all 3 organizations:

```
channel-a: Org1MSP (3 peers) | Org2MSP (3 peers) | Org3MSP (3 peers)
channel-b: Org1MSP (3 peers) | Org2MSP (3 peers) | Org3MSP (3 peers)
```

Endorsement policy: `AND('Org1MSP.peer', 'Org2MSP.peer', 'Org3MSP.peer')`

### CouchDB Indexes

```json
{
  "index": { "fields": ["doc-type", "expiry-date", "quantity", "price", "trader-type"] },
  "ddoc": "indexProductDoc",
  "name": "indexProduct",
  "type": "json"
}
```

---

## Prerequisites

### System Requirements

- **OS:** Linux, macOS, or WSL2 on Windows
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Go:** 1.19+
- **Rust:** 1.70+ (for stream generator and email service)
- **Node.js:** 18+ (for faker generators)
- **Git:** 2.0+

### Software Versions

- Hyperledger Fabric: 2.5.x
- CouchDB: 3.2.x
- Go SDK: github.com/hyperledger/fabric-gateway v1.2+
- Apache Kafka: 4.x (via Docker)
- Apache Flink: 1.20+
- Apache Airflow: 3.x
- Apache Superset: 3.x (in progress)

### Port Requirements

| Service | Ports |
|---|---|
| Org1 peer, chaincode, events | 7051, 7052, 7053 |
| Org2 peer, chaincode, events | 9051, 9052, 9053 |
| Org3 peer, chaincode, events | 8051, 8052, 8053 |
| Fabric CAs | 7054–7057 |
| CouchDB instances | 6007, 6008, 6009 |
| Orderer | 7050 |
| Kafka brokers | 9092, 9094, 9096 |
| Schema Registry | 8081 |
| Kafka UI | 8080 |
| Airflow | 9090 |
| HDFS NameNode UI | 9870 |
| Flink Dashboard | 8091 |
| Superset | 8088 |
| Citus | 5432 |
| PgAdmin for Citus | 5050 |
| Redis | 6379 |
| Postgres (logging) | 5433 |

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/milibovan/hyperledger-commerce-chain
cd commerce-blockchain
```

### 2. Start the Fabric Network

```bash
cd network
chmod +x start-network.sh
./start-network.sh up

# Verify containers
docker ps | grep hyperledger
```

### 3. Create Channels & Deploy Chaincode

```bash
./start-network.sh createChannel
./start-network.sh deployCC
```

### 4. Start Supporting Infrastructure

```bash
# Kafka cluster + Schema Registry + Kafka UI
docker-compose -f compose/compose-kafka.yaml up -d

# HDFS
docker-compose -f compose/compose-hdfs.yaml up -d

# Airflow
docker-compose -f compose/compose-airflow.yaml up -d

# Citus
docker-compose -f compose/compose-citus.yaml up -d

# Redis + Postgres
docker-compose -f compose/compose-db.yaml up -d
```

### 5. Build & Start Microservices

```bash
# Stream generator (Rust)
cd faker-generators/stream-generator
cargo build --release
./target/release/stream-generator

# Email service (Rust)
cd email-service
cargo build --release
./target/release/email-service

# Go backend
cd go
go build -o commerce-api
./commerce-api
```

### 6. Build Client Application (Blockchain CLI)

```bash
cd app
go mod download
go build -o commerce-app
```

---

## Running the Application

### Batch ELT Pipeline

```bash
# Generate JSONL files for all entities
cd faker-generators/batch
node generate.js

# Files are written to the shared volume and picked up by Airflow automatically
# Monitor Airflow DAGs at http://localhost:8082
```

### Stream ELT Pipeline

```bash
# Start the Rust stream generator — it will continuously produce events to Kafka
cd faker-generators/stream-generator
./target/release/stream-generator

# Monitor events at http://localhost:8080 (Kafka UI)
```

### Blockchain CLI – Interactive Mode

```bash
cd app
./run-app.sh
```

### Blockchain CLI – Direct Commands

```bash
# Create a trader
./commerce-app create-trader \
  --org org1 --user User1 --channel channel-a \
  --type SUPERMARKET --vat 123456789 --balance 50000

# Create a user
./commerce-app create-user \
  --org org1 --user User1 --channel channel-a \
  --name Alice --surname Smith --email alice@example.com --balance 5000

# Query products by type
./commerce-app query-by-type \
  --org org1 --user User1 --channel channel-a --type SUPERMARKET
```

---

## Features & Commands

### Invoke Operations

| Command | Description |
|---|---|
| `create-trader` | Create trader (SUPERMARKET, PHARMACY, CARDEALER, GROCERY, GAS_STATION) |
| `create-user` | Create user account with email and initial balance |
| `create-product` | Create product with expiry, price, quantity, trader type |
| `add-product-to-trader` | Associate product with a trader's inventory |
| `buy-product` | Execute purchase, transfer funds, generate receipt |
| `deposit-money` | Add funds to user or trader account |

### Query Operations

| Command | Description |
|---|---|
| `query-by-name` | Find products by name |
| `query-by-id` | Get product by ID |
| `query-by-type` | List products by trader type |
| `query-by-price-range` | Filter products by min/max price |
| `query-by-multiple` | Multi-field filter (name, type, ID, price) |
| `query-by-multiple-range` | Multi-field filter with price range |

---

## Testing

### Run Full Test Suite

```bash
cd app
./test-script.sh
```

Covers: trader creation, user creation, product management, transactions, all query functions, cross-org operations, multi-channel validation.

Expected duration: 2–3 minutes. All tests should pass with block confirmations.

### Single Test Case

```bash
./test-one-case.sh
```

---

## Project Structure

```
commerce-blockchain/
├── network/                          # Fabric network config & scripts
│   ├── start-network.sh
│   ├── configtx.yaml
│   ├── compose/
│   └── organizations/
│
├── chaincode/                        # Hyperledger Fabric chaincode (Go)
│   ├── main.go
│   ├── smart_contract.go
│   ├── creates.go
│   ├── reads.go
│   ├── queries.go
│   └── structs/data.go
│
├── app/                              # CLI client (Go + Fabric SDK)
│   ├── main.go
│   ├── handleCLI.go
│   ├── client/
│   ├── run-app.sh
│   └── test-script.sh
│
├── go/                               # Backend REST API (Go)
│
├── frontend/                         # React + TypeScript web UI
│
├── faker-generators/
│   ├── batch/                        # JS scripts → JSONL files for batch ELT
│   └── stream/
│       ├── *.js                      # JS event generators (common files)
│       └── stream-generator/         # Rust microservice → Avro → Kafka
│
├── schemas/                          # Avro schemas (stream + notification events)
│
├── airflow/                          # Airflow DAGs (JSONL → HDFS raw)
│
├── hdfs/                             # HDFS config (raw + transform zones)
│
├── citus/                            # Citus DB (curated zone, batch + stream)
│
├── kafka1/ kafka2/ kafka3/           # Kafka broker data volumes
│
├── email-service/                    # Rust Kafka consumer → sends emails
│
├── auth-service/                     # Rust auth microservice (planned)
│
├── superset/                         # Superset config (visualization, in progress)
│
└── README.md
```

---

## Known Issues

| # | Issue | Status |
|---|---|---|
| 1 | Date format in CLI must include time: `YYYY-MM-DD HH:MM:SS` | ⚠️ Needs input validation |
| 2 | Org3 can only read, not write certain data (by endorsement policy design) | ✓ By design |
| 3 | Receipt ID extraction in older test script versions | ✓ Fixed |
| 4 | Superset dashboard not yet connected | 🔄 In progress |

---

## Future Improvements

### Phase 1 — Immediate
- Superset dashboards connected to Citus (batch + stream curated data)
- Auth service (Rust) — JWT-based authentication and authorization
- GitHub Actions CI/CD for all services
- Terraform scripts for Confluent Cloud and Azure

### Phase 2 — Medium-term
- Kubernetes orchestration with Helm charts
- Azure Container Apps deployment
- Azure Storage Account for persistent volumes
- MongoDB integration (potential addition for document storage)
- React frontend connected to full backend

### Phase 3 — Long-term
- Payment gateway integration (Stripe/PayPal → blockchain settlement)
- Supply chain product tracking (origin, custody chain, temperature logs)
- Cross-blockchain interoperability (Hyperledger ↔ Ethereum via HTLC)
- Mobile application (React Native or Flutter)
- Advanced analytics: Spark + Grafana pipeline on top of Citus

---

## Architecture Decision Records

### Fabric CA vs Cryptogen
Chose Fabric CA for dynamic enrollment, enterprise flexibility, and automatable credential issuance. Trade-off: requires CA containers and slightly more setup.

### RAFT Consensus (3 Orderers)
Crash Fault Tolerant with automatic leader election. Production-ready without BFT complexity.

### CouchDB State Database
Enables rich JSON queries, multi-field filters, and price range queries natively. LevelDB would require manual iteration for equivalent functionality.

### 9 Peers (3 per Organization)
Provides intra-org redundancy and demonstrates realistic HA configuration. Scalable via compose file updates.

### Endorsement Policy: All 3 Organizations
`AND('Org1MSP.peer', 'Org2MSP.peer', 'Org3MSP.peer')` — ensures no single org can alter transaction history. Trade-off: higher latency than single-org endorsement.

### Rust for Stream Generator & Email Service
Memory safety, low-latency async I/O with Tokio, and zero-cost abstractions make Rust ideal for high-throughput event production and Kafka consumption.

---

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Gateway SDK for Go](https://github.com/hyperledger/fabric-gateway)
- [CouchDB Query Syntax](https://docs.couchdb.org/en/stable/api/database/find.html)
- [RAFT Consensus in Fabric](https://hyperledger-fabric.readthedocs.io/en/release-2.5/orderer/ordering_service.html)
- [Apache Flink Documentation](https://nightlies.apache.org/flink/flink-docs-stable/)
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- Project Specification: PDASP_24_25_projekat.pdf

---

**Repository:** https://github.com/milibovan/hyperledger-commerce-chain  
**License:** MIT  
**Author:** Mili Bovan E2 163/2024  
**Course:** PDASP 2024/25 | Faculty of Technical Sciences Novi Sad  
**Fabric Version:** 2.5.x  
**Status:** 🔄 Active Development
