#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing DOWN batch services"
echo "========================================"

# ── Analytics ─────────────────────────────────────────────────────────────────

echo ""
echo ">> [1/5] Stopping Superset"
docker compose -f superset/docker-compose-image-tag.yml down

# ── Batch-specific services ────────────────────────────────────────────────────

echo ""
echo ">> [2/5] Stopping Citus"
docker compose -f citus/docker-compose.yml down

echo ">> [3/5] Stopping Airflow"
docker compose -f airflow/docker-compose.yml down

# ── Shared infrastructure (batch slice) ───────────────────────────────────────

echo ""
echo ">> [4/5] Stopping Redis"
docker compose stop redis
docker compose rm -f redis

echo ">> [5/5] Stopping Flink & HDFS"
docker compose -f flink/docker-compose.yml down
docker compose -f hdfs/docker-compose.yml down

echo ""
echo "========================================"
echo "  Batch services are DOWN"
echo "========================================"
