-- =============================================================
-- FILE: sinks/02_sinks_trader.sql
-- DESC: HDFS/filesystem sink tables for trader domain events.
-- =============================================================

-- ── TraderCreated ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_trader_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  email          STRING,
  trader_type    STRING,
  balance        FLOAT,
  vat            STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/traders/created',
  'format'    = 'avro'
);

-- ── TraderDeleted ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_trader_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/traders/deleted',
  'format'    = 'avro'
);
