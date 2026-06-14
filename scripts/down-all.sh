#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing DOWN all services"
echo "========================================"

cd ..
# ── Application services ───────────────────────────────────────────────────────

# echo ""
# echo ">> [1/9] Stopping application services (auth, email, go, frontend)"
# docker compose -f commerce-chain-frontend/docker-compose.yml down
# docker compose -f go/docker-compose.yml down
# docker compose -f email-service/docker-compose.yml down
# docker compose -f auth-service/docker-compose.yml down

# ── Analytics / visualisation ──────────────────────────────────────────────────

echo ""
echo ">> [2/9] Stopping Superset"
docker compose -f superset/docker-compose-image-tag.yml down

# ── Batch services ─────────────────────────────────────────────────────────────

echo ""
echo ">> [3/9] Stopping Citus"
docker compose -f citus/docker-compose.yml down

echo ">> [4/9] Stopping Airflow"
docker compose -f airflow/docker-compose.yml down

# ── Stream services ────────────────────────────────────────────────────────────

echo ""
echo ">> [5/9] Stopping Schema Registry, Kafka UI & stream generator"
docker compose stop schema-registry kafka-ui stream-generator
docker compose rm -f schema-registry kafka-ui stream-generator

echo ">> [6/9] Stopping Kafka cluster"
docker compose down kafka3
docker compose down kafka2
docker compose down kafka1

# ── Shared infrastructure ─────────────────────────────────────────────────────

echo ""
echo ">> [7/9] Stopping Redis"
docker compose stop redis
docker compose rm -f redis

echo ">> [8/9] Stopping Flink"
docker compose -f flink/docker-compose.yml down

echo ">> [9/9] Stopping HDFS"
docker compose -f hdfs/docker-compose.yml down

echo ""
echo "========================================"
echo "  All services are DOWN"
echo "========================================"
