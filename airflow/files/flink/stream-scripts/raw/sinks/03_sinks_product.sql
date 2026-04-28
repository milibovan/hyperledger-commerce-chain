-- =============================================================
-- FILE: sinks/03_sinks_product.sql
-- DESC: HDFS/filesystem sink tables for product domain events.
-- =============================================================

-- ── ProductCreated ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_product_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  price          FLOAT,
  quantity       BIGINT,
  trader_type    STRING,
  expiry_date    BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/products/created',
  'format'    = 'avro'
);

-- ── ProductDeleted ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_product_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/products/deleted',
  'format'    = 'avro'
);
