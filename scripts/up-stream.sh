#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Bringing UP stream services"
echo "========================================"

cd ..
# ── Shared infrastructure (stream slice) ──────────────────────────────────────

echo ""
echo ">> [1/4] Starting shared infrastructure (HDFS, Flink, Redis)"
docker compose -f hdfs/docker-compose.yml up -d
docker compose -f flink/docker-compose.yml up -d --scale taskmanager=3
docker compose up -d redis
sleep 10

# ── Kafka cluster ──────────────────────────────────────────────────────────────

echo ""
echo ">> [2/4] Starting Kafka cluster (brokers 1, 2, 3)"
docker compose up -d kafka-ui
docker compose up -d kafka1
docker compose up -d kafka2
docker compose up -d kafka3
sleep 20

# ── Kafka ecosystem ────────────────────────────────────────────────────────────

echo ""
echo ">> [3/4] Starting Schema Registry, Kafka UI & stream generator"
docker compose up -d schema-registry stream-generator

# ── Analytics ─────────────────────────────────────────────────────────────────

echo ""
echo ">> [4/4] Starting Superset"
docker compose -f superset/docker-compose-image-tag.yml up -d

echo ""
echo "========================================"
echo "  Stream services are UP"
echo "========================================"
