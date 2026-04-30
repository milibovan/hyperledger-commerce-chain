#!/usr/bin/env bash
# =============================================================
# FILE: run_pipeline.sh
# DESC: Merges all SQL files into a single session and pipes
#       them to sql-client, preserving table visibility across
#       DDL and DML statements.
#
# Usage (inside container):
#   bash ./stream-scripts/run_pipeline.sh
#
# Usage (from host):
#   docker compose exec jobmanager bash ./stream-scripts/run_pipeline.sh
#
# Requirements:
#   - FLINK_HOME must be set (default: /opt/flink)
# =============================================================

set -euo pipefail

if [[ $# -ne 1 ]] || [[ "$1" != "raw" && "$1" != "transform" ]]; then
  echo "Usage: $0 <zone>"
  echo "  zone: raw | transform"
  exit 1
fi

ZONE="$1"
FLINK_HOME="${FLINK_HOME:-/opt/flink}"
SQL_CLIENT="$FLINK_HOME/bin/sql-client.sh"
SCRIPT_DIR="${SCRIPT_DIR:-./stream-scripts}"
ZONE_DIR="$SCRIPT_DIR/$ZONE"

echo "▶  Merging and submitting [$ZONE] pipeline SQL..."

cat \
  "$ZONE_DIR/00_pipeline_config.sql" \
  "$ZONE_DIR/sources/01_sources_user.sql" \
  "$ZONE_DIR/sources/02_sources_trader.sql" \
  "$ZONE_DIR/sources/03_sources_product.sql" \
  "$ZONE_DIR/sources/04_sources_receipt.sql" \
  "$ZONE_DIR/sources/05_sources_order.sql" \
  "$ZONE_DIR/sources/06_sources_request.sql" \
  "$ZONE_DIR/sinks/01_sinks_user.sql" \
  "$ZONE_DIR/sinks/02_sinks_trader.sql" \
  "$ZONE_DIR/sinks/03_sinks_product.sql" \
  "$ZONE_DIR/sinks/04_sinks_receipt.sql" \
  "$ZONE_DIR/sinks/05_sinks_order.sql" \
  "$ZONE_DIR/sinks/06_sinks_request.sql" \
  "$ZONE_DIR/inserts/01_inserts_all.sql" \
| "$SQL_CLIENT" -

echo "🎉 [$ZONE] pipeline submitted successfully."