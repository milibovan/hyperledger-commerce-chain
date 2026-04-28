-- =============================================================
-- FILE: sources/03_sources_product.sql
-- DESC: Kafka source table for the `products` topic.
-- =============================================================

CREATE TABLE IF NOT EXISTS product_kafka_source (
  -- ── Envelope ──────────────────────────────────────────────
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,  -- e.g. ProductCreated | ProductDeleted
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,

  -- ── ProductCreated fields ─────────────────────────────────
  `name`      STRING,
  price       FLOAT,
  quantity    BIGINT,
  trader_type STRING,
  expiry_date BIGINT,

  -- ── Kafka metadata ───────────────────────────────────────
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND

) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'products',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);
