-- =============================================================
-- FILE: sources/01_sources_user.sql
-- DESC: Kafka source table for the `users` topic.
--       Deserialises Avro via Confluent Schema Registry.
--       Watermark: event-time with 5-second allowed lateness.
-- =============================================================

CREATE TABLE IF NOT EXISTS user_kafka_source (
  -- ── Envelope ──────────────────────────────────────────────
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,  -- e.g. UserCreated | UserDeleted
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,           -- epoch-ms from the domain event
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,

  -- ── UserCreated fields ────────────────────────────────────
  `name`    STRING,
  surname   STRING,
  email     STRING,
  balance   FLOAT,

  -- ── UserDeleted fields ────────────────────────────────────
  reason    STRING,

  -- ── Kafka metadata ───────────────────────────────────────
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND

) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'users',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);
