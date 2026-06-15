#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing UP batch services"
echo "========================================"
 
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
 
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    exit 1
fi
 
REDIS_HOST=$(grep -E '^REDIS_HOST=' "$ENV_FILE" | cut -d '=' -f2-)
REDIS_PORT=$(grep -E '^REDIS_PORT=' "$ENV_FILE" | cut -d '=' -f2-)
REDIS_PASSWORD=$(grep -E '^REDIS_PASSWORD=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
 
if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ] || [ -z "$REDIS_PASSWORD" ]; then
    echo "ERROR: One or more Redis variables (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) are missing from .env"
    exit 1
fi
 
export REDIS_HOST REDIS_PORT REDIS_PASSWORD
echo ">> Redis config loaded: host=$REDIS_HOST port=$REDIS_PORT"

cd ..
# ── Shared infrastructure (batch slice) ───────────────────────────────────────

echo ""
echo ">> [1/5] Starting shared infrastructure (HDFS, Flink, Redis)"
docker compose -f hdfs/docker-compose.yml up -d
docker compose -f flink/docker-compose.yml up -d --scale taskmanager=2
docker compose up -d redis
sleep 10
# docker exec -it redis redis-cli -a $REDIS_PASSWORD FLUSHALL

# ── Batch-specific services ────────────────────────────────────────────────────

echo ""
echo ">> [2/5] Starting Airflow"
docker compose -f airflow/docker-compose.yml up -d --scale airflow-worker=2
# docker compose -f airflow/docker-compose.yml up -d
sleep 25

echo ">> [3/5] Starting Citus"
docker compose -f citus/docker-compose.yml up -d
sleep 10

# ── Analytics ─────────────────────────────────────────────────────────────────

echo ""
echo ">> [4/5] Starting Superset"
# docker compose -f superset/docker-compose-image-tag.yml up -d

# ── Batch data generation ──────────────────────────────────────────────────────

echo ""
echo ">> [5/5] Running batch data generator"
# if [ -f "faker-generators/batch-generator/index.js" ]; then
#     node faker-generators/batch-generator/index.js
# else
#     echo "    WARNING: faker-generators/batch-generator/index.js not found, skipping"
# fi

echo ""
echo "========================================"
echo "  Batch services are UP"
echo "========================================"
