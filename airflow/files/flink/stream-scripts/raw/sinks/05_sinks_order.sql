-- =============================================================
-- FILE: sinks/05_sinks_order.sql
-- DESC: HDFS/filesystem sink tables for order domain events.
-- =============================================================

-- ── OrderApproved ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_order_approved (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/orders/approved',
  'format'    = 'avro'
);

-- ── OrderCancelled ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_order_cancelled (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/orders/cancelled',
  'format'    = 'avro'
);

-- ── OrderCompleted ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_order_completed (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  receipt_ids    ARRAY<STRING>,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/orders/completed',
  'format'    = 'avro'
);

-- ── OrderCreated ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_order_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost     FLOAT,
  request_id     STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/orders/created',
  'format'    = 'avro'
);

-- ── OrderFulfilled ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_order_fulfilled (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/orders/fulfilled',
  'format'    = 'avro'
);
