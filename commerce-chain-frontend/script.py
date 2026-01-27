import json
import random
import string

# ---------------------------------------------------------
# 1. HELPER: Generate 24-char Hex IDs (Trello Requirement)
# ---------------------------------------------------------
def get_id():
    return ''.join(random.choices('0123456789abcdef', k=24))

# ---------------------------------------------------------
# 2. YOUR BOARD CONFIGURATION (Extracted from your file)
# ---------------------------------------------------------
# We preserve your exact List IDs so the structure remains identical
LIST_MAP = {
    "Backlog": "696a80779689369f174b1578",
    "Design": "696a80779689369f174b1579",
    "ToDo": "696a80779689369f174b157a",
    "Doing": "696a80779689369f174b157b",
    "CodeReview": "696a80779689369f174b157d",
    "Testing": "696a80779689369f174b157e",
    "Done": "696a80779689369f174b157c"
}

# The Base Template (Your settings, stripped of old cards)
BASE_BOARD = {
    "name": "Master Project: Complete Implementation",
    "desc": "Full 11-Week Implementation Plan (Generated from Script)",
    "closed": False,
    "idOrganization": "641dfaa7ebaaea9294e49f2f", 
    "prefs": {
        "permissionLevel": "private",
        "comments": "members",
        "invitations": "members",
        "cardCovers": True,
        "background": "5dfa855f31b76a80318febaf", # Your pink/blue background
        "backgroundBottomColor": "#068faa",
        "backgroundTopColor": "#ddaba7"
    },
    "labelNames": {
        "green": "Phase 1: Foundation",
        "yellow": "Phase 2: Data/Infra",
        "orange": "Phase 3: K8s/Cloud",
        "blue": "Phase 4: Data Lake",
        "purple": "Phase 5: Streaming",
        "red": "Phase 6: Orchestration",
        "sky": "Phase 7: Viz",
        "pink": "Optional",
        "lime": "",
        "black": ""
    },
    # Your exact lists
    "lists": [
        {"id": LIST_MAP["Backlog"], "name": "Backlog", "pos": 65535, "closed": False},
        {"id": LIST_MAP["Design"], "name": "Design", "pos": 131071, "closed": False},
        {"id": LIST_MAP["ToDo"], "name": "To Do", "pos": 196607, "closed": False},
        {"id": LIST_MAP["Doing"], "name": "Doing", "pos": 262143, "closed": False},
        {"id": LIST_MAP["CodeReview"], "name": "Code Review", "pos": 294911, "closed": False},
        {"id": LIST_MAP["Testing"], "name": "Testing", "pos": 311295, "closed": False},
        {"id": LIST_MAP["Done"], "name": "Done 🎉", "pos": 393215, "closed": False}
    ],
    "cards": [],
    "checklists": []
}

# ---------------------------------------------------------
# 3. THE COMPLETE CHECKLIST DATA (Weeks 1-11)
# ---------------------------------------------------------
project_phases = [
    {
        "phase": "Phase 1: Foundation & Security",
        "color": "green",
        "cards": [
            {
                "title": "Week 1: Authentication Service",
                "desc": "**Goal:** Set up Rust workspace and basic Auth API.\n**Dependencies:** None",
                "tasks": [
                    "Create new Rust workspace for microservices",
                    "Initialize auth-service crate with Cargo",
                    "Add dependencies: axum/actix-web, tokio, sqlx, argon2, jsonwebtoken",
                    "Set up project structure (routes, handlers, models, utils)",
                    "Configure environment variables (.env)",
                    "Implement logging/tracing"
                ]
            },
            {
                "title": "Week 1: Database & Models",
                "desc": "**Goal:** PostgreSQL setup and Schema design.",
                "tasks": [
                    "Provision PostgreSQL database",
                    "Create Schema: users (id, email, password_hash, role, is_verified)",
                    "Create Schema: verification_tokens",
                    "Create Schema: refresh_tokens",
                    "Write SQLx migration scripts",
                    "Implement DB connection pool",
                    "Create User struct and repository layer"
                ]
            },
            {
                "title": "Week 1: Core Auth Logic",
                "desc": "**Goal:** Registration and Login flows.",
                "tasks": [
                    "Impl Registration: Input validation & Password Hashing (Argon2)",
                    "Impl Registration: DB Insert & Token Gen",
                    "Impl Login: Credential validation",
                    "Impl Login: JWT Generation (Access + Refresh Tokens)",
                    "Impl JWT Validation Middleware",
                    "Impl Refresh Token Rotation Endpoint"
                ]
            },
            {
                "title": "Week 2: Security & Gateway",
                "desc": "**Goal:** Email verification, Password reset, and API Gateway.",
                "tasks": [
                    "Impl Email Verification Endpoint",
                    "Setup Mock Email Service (print to stdout or Kafka)",
                    "Impl Forgot/Reset Password Endpoints",
                    "Create gateway-service crate",
                    "Impl Reverse Proxy Logic (Hyper/Reqwest)",
                    "Impl Rate Limiting Middleware (Redis)",
                    "Impl Auth Middleware in Gateway",
                    "Setup Redis for Session/Rate-limit storage"
                ]
            }
        ]
    },
    {
        "phase": "Phase 2: Data Gen & Infra",
        "color": "yellow",
        "cards": [
            {
                "title": "Week 2-3: Historical Data Generation",
                "desc": "**Goal:** Generate 300MB+ of realistic CSV data.",
                "tasks": [
                    "Setup Python Faker environment",
                    "Generate Users.csv (50k rows)",
                    "Generate Traders.csv (5k rows)",
                    "Generate Products.csv (20k rows)",
                    "Generate Orders.csv (500k rows, linked to Users/Products)",
                    "Generate Receipts.csv (1M rows)",
                    "Validate Referential Integrity",
                    "Export to CSV and Parquet formats"
                ]
            },
            {
                "title": "Week 3: Real-time Data Generator",
                "desc": "**Goal:** Script to pump events into Kafka.",
                "tasks": [
                    "Create realtime-generator service (Python/Node)",
                    "Define Event Schemas (NewOrder, PriceChange)",
                    "Impl Kafka Producer",
                    "Configurable event rate (10-50 events/sec)",
                    "Test generation flow locally"
                ]
            },
            {
                "title": "Week 3: Infrastructure (Terraform)",
                "desc": "**Goal:** Cloud setup (Oracle/AWS/Azure).",
                "tasks": [
                    "Initialize Terraform project",
                    "Module: Networking (VCN, Subnets, Security Lists)",
                    "Module: Compute (VMs for K8s/DBs)",
                    "Module: Storage (Block Volumes)",
                    "Module: Kubernetes (K3s or Managed)",
                    "Apply Terraform & Verify Access (SSH/Kubectl)"
                ]
            }
        ]
    },
    {
        "phase": "Phase 3: Kubernetes",
        "color": "orange",
        "cards": [
            {
                "title": "Week 4: Service Deployment (Stateless)",
                "desc": "**Goal:** Deploy Frontend, Backend, Auth, Gateway.",
                "tasks": [
                    "Dockerize all existing services",
                    "Create K8s Deployments (Auth, Gateway, Backend)",
                    "Create K8s Services (ClusterIP)",
                    "Create ConfigMaps for Env Variables",
                    "Create Secrets for DB Creds/Keys"
                ]
            },
            {
                "title": "Week 4: Infrastructure Deployment (Stateful)",
                "desc": "**Goal:** Deploy DBs, Kafka, Redis on K8s.",
                "tasks": [
                    "Deploy PostgreSQL (StatefulSet + PVC)",
                    "Deploy Redis (Helm Chart)",
                    "Deploy Kafka & Zookeeper (Strimzi Operator)",
                    "Deploy Schema Registry",
                    "Verify Persistence (Restart pods and check data)"
                ]
            },
            {
                "title": "Week 4: Networking & CI/CD",
                "desc": "**Goal:** External Access and Automation.",
                "tasks": [
                    "Install Nginx Ingress Controller",
                    "Configure Ingress Routes (/api -> Gateway)",
                    "Setup GitHub Actions: Build & Test",
                    "Setup GitHub Actions: Build Docker & Push to GHCR",
                    "Setup GitHub Actions: Deploy to K8s (Manifest update)"
                ]
            }
        ]
    },
    {
        "phase": "Phase 4: Data Lake",
        "color": "blue",
        "cards": [
            {
                "title": "Week 5: HDFS & Ingestion",
                "desc": "**Goal:** Raw Data Layer Setup.",
                "tasks": [
                    "Deploy HDFS Cluster (NameNode + DataNodes)",
                    "Create Folder Structure (/raw, /transform, /curated)",
                    "Run script to ingest Historical CSVs to /raw",
                    "Deploy Kafka Connect",
                    "Configure HDFS Sink Connector for Real-time topics"
                ]
            },
            {
                "title": "Week 5-6: Spark Setup & Batch Processing",
                "desc": "**Goal:** Spark Cluster and Batch Jobs.",
                "tasks": [
                    "Deploy Spark on K8s (Spark Operator)",
                    "Configure Spark access to HDFS",
                    "Write ETL Job: Raw -> Parquet (Cleaning)",
                    "Write Job: User Aggregations",
                    "Write Job: Product Sales Analysis",
                    "Submit Jobs and Verify Output in /curated"
                ]
            },
            {
                "title": "Week 6: Complex Analytics (10 Queries)",
                "desc": "**Goal:** Implement the required complex queries.",
                "tasks": [
                    "Query 1: Total Revenue by Trader (Rank)",
                    "Query 2: User Avg Order Value (Running Total)",
                    "Query 3: Top 10 Products (Dense Rank)",
                    "Query 4: Trader Fulfillment Rate (Lag/Lead)",
                    "Query 5: Monthly Sales Trends (Moving Avg)",
                    "Query 6: Customer RFM Segmentation",
                    "Query 7: Stock Turnover Rate",
                    "Query 8: Price Fluctuation Analysis",
                    "Query 9: Peak Order Hours",
                    "Query 10: Revenue Forecasting (Regression)"
                ]
            }
        ]
    },
    {
        "phase": "Phase 5: Streaming",
        "color": "purple",
        "cards": [
            {
                "title": "Week 7: Stream Processing (Flink)",
                "desc": "**Goal:** Real-time transformation engine.",
                "tasks": [
                    "Deploy Flink Cluster on K8s",
                    "Deploy ElasticSearch/TimescaleDB (Sink)",
                    "Impl Trans 1: Inventory Updates (Stream-Table Join)",
                    "Impl Trans 2: Price Change Alerts (Windowing)",
                    "Impl Trans 3: Fraud Detection (Pattern Matching)",
                    "Impl Trans 4: Live Dashboard Metrics",
                    "Impl Trans 5: Trader Ranking"
                ]
            }
        ]
    },
    {
        "phase": "Phase 6: Orchestration",
        "color": "red",
        "cards": [
            {
                "title": "Week 8: Orchestration & Monitoring",
                "desc": "**Goal:** Airflow and Observability.",
                "tasks": [
                    "Deploy Apache Airflow",
                    "Create DAG: Daily Batch ETL",
                    "Create DAG: Data Quality Checks",
                    "Deploy Prometheus & Grafana",
                    "Setup Dashboards (K8s, Kafka, App Metrics)",
                    "Configure Alerts (Slack/Email)"
                ]
            }
        ]
    },
    {
        "phase": "Phase 7: Visualization",
        "color": "sky",
        "cards": [
            {
                "title": "Week 9: Dashboards",
                "desc": "**Goal:** Superset and Custom UI.",
                "tasks": [
                    "Deploy Apache Superset",
                    "Connect Superset to Hive/Presto/Postgres",
                    "Build Sales Performance Dashboard",
                    "Build Real-time Operations Dashboard",
                    "Impl Custom Frontend Analytics Page",
                    "Integrate WebSockets for Live Charts"
                ]
            }
        ]
    },
    {
        "phase": "Phase 8: Advanced (Optional)",
        "color": "pink",
        "cards": [
            {
                "title": "Weeks 10-11: Polish & Advanced",
                "desc": "**Goal:** HPC, Load Testing, Documentation.",
                "tasks": [
                    "HPC: Implement OpenMP/MPI module",
                    "Load Testing: Run K6 scripts",
                    "Chaos Testing: Kill pods and verify recovery",
                    "Finalize README and Architecture Diagrams",
                    "Prepare Project Defense Demo"
                ]
            }
        ]
    }
]

# ---------------------------------------------------------
# 4. GENERATOR LOGIC
# ---------------------------------------------------------
card_pos_counter = 10000  # Start cards at top of backlog

for phase in project_phases:
    for card_data in phase["cards"]:
        
        # 1. Create Card Object
        card_id = get_id()
        new_card = {
            "id": card_id,
            "idList": LIST_MAP["Backlog"],
            "name": card_data["title"],
            "desc": card_data["desc"] + f"\n\n**Phase:** {phase['phase']}",
            "pos": card_pos_counter,
            "closed": False,
            "idLabels": [],
            "labels": [
                {
                   "color": phase["color"],
                   "name": phase["phase"]
                }
            ],
            "idChecklists": []
        }
        
        # 2. Create Checklist Object
        if card_data["tasks"]:
            checklist_id = get_id()
            checklist = {
                "id": checklist_id,
                "idCard": card_id,
                "name": "Implementation Tasks",
                "idBoard": BASE_BOARD["idOrganization"], # Using Org ID structure usually fine for import
                "pos": 1,
                "checkItems": []
            }
            
            # 3. Add Items to Checklist
            item_pos = 1
            for task in card_data["tasks"]:
                item = {
                    "id": get_id(),
                    "name": task,
                    "state": "incomplete",
                    "pos": item_pos
                }
                checklist["checkItems"].append(item)
                item_pos += 100
            
            # 4. Link checklist to card and board
            new_card["idChecklists"].append(checklist_id)
            BASE_BOARD["checklists"].append(checklist)

        # 5. Add Card to Board
        BASE_BOARD["cards"].append(new_card)
        card_pos_counter += 1000

# ---------------------------------------------------------
# 5. EXPORT
# ---------------------------------------------------------
output_filename = "trello_import_final.json"
with open(output_filename, "w", encoding="utf-8") as f:
    json.dump(BASE_BOARD, f, indent=2)

print(f"Success! Created {output_filename}")
print(f"Cards generated: {len(BASE_BOARD['cards'])}")
print("Instructions: Open Trello -> Create New Board -> Start with JSON -> Upload 'trello_import_final.json'")