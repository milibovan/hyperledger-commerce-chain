#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing UP batch services"
echo "========================================"

# ── Shared infrastructure (batch slice) ───────────────────────────────────────

echo ""
echo ">> [1/5] Starting shared infrastructure (HDFS, Flink, Redis)"
docker compose -f hdfs/docker-compose.yml up -d
docker compose -f flink/docker-compose.yml up -d
docker compose up -d redis
sleep 10

# ── Batch-specific services ────────────────────────────────────────────────────

echo ""
echo ">> [2/5] Starting Airflow"
docker compose -f airflow/docker-compose.yml up -d
sleep 25

echo ">> [3/5] Starting Citus"
docker compose -f citus/docker-compose.yml up -d
sleep 10

# ── Analytics ─────────────────────────────────────────────────────────────────

echo ""
echo ">> [4/5] Starting Superset"
docker compose -f superset/docker-compose-image-tag.yml up -d

# ── Batch data generation ──────────────────────────────────────────────────────

echo ""
echo ">> [5/5] Running batch data generator"
if [ -f "faker-generators/batch-generator/index.js" ]; then
    node faker-generators/batch-generator/index.js
else
    echo "    WARNING: faker-generators/batch-generator/index.js not found, skipping"
fi

echo ""
echo "========================================"
echo "  Batch services are UP"
echo "========================================"
