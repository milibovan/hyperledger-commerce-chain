-- =============================================================
-- FILE: sinks/01_sinks_user.sql
-- DESC: HDFS/filesystem sink tables for user domain events.
--       Output format: Avro.
--       Partitioning: managed by Flink's rolling policy (default).
-- =============================================================

-- ── UserCreated ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_user_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,       -- original domain event epoch-ms
  `name`         STRING,
  surname        STRING,
  email          STRING,
  balance        FLOAT,
  kafka_ts       TIMESTAMP(3)  -- Kafka record ingestion timestamp
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/users/created',
  'format'    = 'avro'
);

-- ── UserDeleted ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hdfs_user_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path'      = 'hdfs://namenode:9000/datalake/raw/users/deleted',
  'format'    = 'avro'
);
