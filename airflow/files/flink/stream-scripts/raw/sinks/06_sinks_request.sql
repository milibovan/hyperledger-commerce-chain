-- =============================================================
-- FILE: sinks/06_sinks_request.sql
-- DESC: HDFS/filesystem sink tables for request domain events.
-- =============================================================

-- ── RequestApproved ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_approved (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/approved',
  'format'    = 'avro'
);

-- ── RequestCancelled ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_cancelled (
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
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/cancelled',
  'format'    = 'avro'
);

-- ── RequestCreated ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_created (
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
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/created',
  'format'    = 'avro'
);

-- ── RequestExpired ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_expired (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  due_date       BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/expired',
  'format'    = 'avro'
);

-- ── RequestFulfilled ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_fulfilled (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  order_id       STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/fulfilled',
  'format'    = 'avro'
);

-- ── RequestPending ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_pending (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/pending',
  'format'    = 'avro'
);

-- ── RequestRejected ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_request_rejected (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/requests/rejected',
  'format'    = 'avro'
);
