-- =============================================================
-- FILE: sinks/04_sinks_receipt.sql
-- DESC: HDFS/filesystem sink tables for receipt domain events.
-- =============================================================

-- ── ReceiptCreated ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_receipt_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  trader_id      STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost     FLOAT,
  due_date       BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/receipts/created',
  'format'    = 'avro'
);

-- ── ReceiptCancelled ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_receipt_cancelled (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/receipts/cancelled',
  'format'    = 'avro'
);
