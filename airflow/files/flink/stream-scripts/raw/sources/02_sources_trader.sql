-- =============================================================
-- FILE: sources/02_sources_trader.sql
-- DESC: Kafka source table for the `traders` topic.
-- =============================================================

CREATE TABLE IF NOT EXISTS trader_kafka_source (
  -- ── Envelope ──────────────────────────────────────────────
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,  -- e.g. TraderCreated | TraderDeleted
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,

  -- ── TraderCreated fields ──────────────────────────────────
  `name`      STRING,
  email       STRING,
  trader_type STRING,
  balance     FLOAT,
  vat         STRING,

  -- ── TraderDeleted fields ──────────────────────────────────
  reason      STRING,

  -- ── Kafka metadata ───────────────────────────────────────
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND

) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'traders',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);
