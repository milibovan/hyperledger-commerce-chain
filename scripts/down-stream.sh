#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing DOWN stream services"
echo "========================================"

# ── Analytics ─────────────────────────────────────────────────────────────────

echo ""
echo ">> [1/4] Stopping Superset"
docker compose -f superset/docker-compose-image-tag.yml down

# ── Kafka ecosystem ────────────────────────────────────────────────────────────

echo ""
echo ">> [2/4] Stopping Schema Registry, Kafka UI & stream generator"
docker compose stop schema-registry kafka-ui stream-generator
docker compose rm -f schema-registry kafka-ui stream-generator

# ── Kafka cluster ──────────────────────────────────────────────────────────────

echo ""
echo ">> [3/4] Stopping Kafka cluster (brokers 3, 2, 1)"
docker compose down kafka3
docker compose down kafka2
docker compose down kafka1

# ── Shared infrastructure (stream slice) ──────────────────────────────────────

echo ""
echo ">> [4/4] Stopping Redis, Flink & HDFS"
docker compose stop redis
docker compose rm -f redis
docker compose -f flink/docker-compose.yml down
docker compose -f hdfs/docker-compose.yml down

echo ""
echo "========================================"
echo "  Stream services are DOWN"
echo "========================================"
