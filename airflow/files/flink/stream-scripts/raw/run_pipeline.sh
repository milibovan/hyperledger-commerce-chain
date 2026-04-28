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

FLINK_HOME="${FLINK_HOME:-/opt/flink}"
SQL_CLIENT="$FLINK_HOME/bin/sql-client.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶  Merging and submitting pipeline SQL..."

cat \
  "$SCRIPT_DIR/00_pipeline_config.sql" \
  "$SCRIPT_DIR/sources/01_sources_user.sql" \
  "$SCRIPT_DIR/sources/02_sources_trader.sql" \
  "$SCRIPT_DIR/sources/03_sources_product.sql" \
  "$SCRIPT_DIR/sources/04_sources_receipt.sql" \
  "$SCRIPT_DIR/sources/05_sources_order.sql" \
  "$SCRIPT_DIR/sources/06_sources_request.sql" \
  "$SCRIPT_DIR/sinks/01_sinks_user.sql" \
  "$SCRIPT_DIR/sinks/02_sinks_trader.sql" \
  "$SCRIPT_DIR/sinks/03_sinks_product.sql" \
  "$SCRIPT_DIR/sinks/04_sinks_receipt.sql" \
  "$SCRIPT_DIR/sinks/05_sinks_order.sql" \
  "$SCRIPT_DIR/sinks/06_sinks_request.sql" \
  "$SCRIPT_DIR/inserts/01_inserts_all.sql" \
| "$SQL_CLIENT" -

echo "🎉 Pipeline submitted successfully."