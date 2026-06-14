#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing UP all services"
echo "========================================"

 
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
 
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi
 
REDIS_HOST=$(grep -E '^REDIS_HOST=' "$ENV_FILE" | cut -d '=' -f2-)
REDIS_PORT=$(grep -E '^REDIS_PORT=' "$ENV_FILE" | cut -d '=' -f2-)
REDIS_PASSWORD=$(grep -E '^REDIS_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2-)
 
if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ] || [ -z "$REDIS_PASSWORD" ]; then
    echo "ERROR: One or more Redis variables (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) are missing from .env"
    exit 1
fi
 
export REDIS_HOST REDIS_PORT REDIS_PASSWORD
echo ">> Redis config loaded: host=$REDIS_HOST port=$REDIS_PORT"

cd ..
# ── Shared infrastructure ─────────────────────────────────────────────────────

echo ""
echo ">> [1/9] Starting shared infrastructure (Redis, HDFS, Flink)"
docker compose -f hdfs/docker-compose.yml up -d
docker compose -f flink/docker-compose.yml up -d
docker compose up -d redis
sleep 10

# ── Stream services ────────────────────────────────────────────────────────────

echo ""
echo ">> [2/9] Starting Kafka cluster"
docker compose up -d kafka1
docker compose up -d kafka2
docker compose up -d kafka3
sleep 20

echo ">> [3/9] Starting Schema Registry, Kafka UI & stream generator"
docker compose up -d schema-registry kafka-ui stream-generator

# ── Batch services ─────────────────────────────────────────────────────────────

echo ""
echo ">> [4/9] Starting Airflow"
docker compose -f airflow/docker-compose.yml up -d
sleep 25

echo ">> [5/9] Starting Citus"
docker compose -f citus/docker-compose.yml up -d
sleep 10

# ── Analytics / visualisation ──────────────────────────────────────────────────

echo ""
echo ">> [6/9] Starting Superset"
docker compose -f superset/docker-compose-image-tag.yml up -d

# ── Application services ───────────────────────────────────────────────────────

# echo ""
# echo ">> [7/9] Starting application services (auth, email, go, frontend)"
# docker compose -f auth-service/docker-compose.yml up -d
# docker compose -f email-service/docker-compose.yml up -d
# docker compose -f go/docker-compose.yml up -d
# docker compose -f commerce-chain-frontend/docker-compose.yml up -d

# ── Batch data generation ──────────────────────────────────────────────────────

echo ""
echo ">> [8/9] Running batch data generator"
if [ -f "faker-generators/batch-generator/index.js" ]; then
    node faker-generators/batch-generator/index.js
else
    echo "    WARNING: faker-generators/batch-generator/index.js not found, skipping"
fi

echo ""
echo "========================================"
echo "  All services are UP"
echo "========================================"
