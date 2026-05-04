#!/usr/bin/env bash
# =============================================================
# FILE: run_pipeline.sh
# DESC: Merges all SQL files for a given zone into a single
#       temp file and submits it via sql-client -f.
#
#       Why not pipe (cat ... | sql-client -)?
#         sql-client stdin mode fails with "only single statement
#         supported" when multiple DDL statements are present.
#
#       Why not --init per file?
#         --init only accepts ONE file; extra --init flags are
#         silently ignored, so source/sink tables never register.
#
#       Why not -f per file?
#         Each -f invocation is a separate session; tables created
#         in one session are invisible to the next.
#
#       Solution: merge everything into one temp file, then run
#       sql-client -f on that single file. One session, one parse.
#
# Usage (inside container):
#   bash ./stream-scripts/run_pipeline.sh <zone>
#
# Usage (from host):
#   docker compose exec jobmanager bash ./stream-scripts/run_pipeline.sh <zone>
#
# Arguments:
#   zone: raw | transform
#
# Requirements:
#   - FLINK_HOME must be set or defaults to /opt/flink
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
SCRIPT_DIR="${SCRIPT_DIR:-$(dirname "$0")}"
ZONE_DIR="$SCRIPT_DIR/$ZONE"

SQL_FILES=(
  "$ZONE_DIR/00_pipeline_config.sql"
  "$ZONE_DIR/sources/01_sources_user.sql"
  "$ZONE_DIR/sources/02_sources_trader.sql"
  "$ZONE_DIR/sources/03_sources_product.sql"
  "$ZONE_DIR/sources/04_sources_receipt.sql"
  "$ZONE_DIR/sources/05_sources_order.sql"
  "$ZONE_DIR/sources/06_sources_request.sql"
  "$ZONE_DIR/sinks/01_sinks_user.sql"
  "$ZONE_DIR/sinks/02_sinks_trader.sql"
  "$ZONE_DIR/sinks/03_sinks_product.sql"
  "$ZONE_DIR/sinks/04_sinks_receipt.sql"
  "$ZONE_DIR/sinks/05_sinks_order.sql"
  "$ZONE_DIR/sinks/06_sinks_request.sql"
  "$ZONE_DIR/inserts/01_inserts_all.sql"
)

# Merge into a single temp file so sql-client sees one session.
# Each file is separated by a blank line to guarantee statement
# boundaries are never joined across file edges.
MERGED=$(mktemp /tmp/flink_pipeline_XXXXXX.sql)
trap 'rm -f "$MERGED"' EXIT

echo "▶  Merging [$ZONE] SQL files..."
for file in "${SQL_FILES[@]}"; do
  echo "   + $(basename "$file")"
  cat "$file" >> "$MERGED"
  echo ""  >> "$MERGED"   # blank line separator between files
done

echo "▶  Submitting [$ZONE] pipeline..."
"$SQL_CLIENT" -f "$MERGED"

echo "🎉 [$ZONE] pipeline submitted successfully."