-- =============================================================
-- FILE: sources/04_sources_receipt.sql
-- DESC: Kafka source table for the `receipts` topic.
-- =============================================================

CREATE TABLE IF NOT EXISTS receipt_kafka_source (
  -- ── Envelope ──────────────────────────────────────────────
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,  -- e.g. ReceiptCreated | ReceiptCancelled
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,

  -- ── ReceiptCreated fields ─────────────────────────────────
  user_id    STRING,
  trader_id  STRING,
  products   ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost FLOAT,
  due_date   BIGINT,

  -- ── ReceiptCancelled fields ───────────────────────────────
  reason     STRING,

  -- ── Kafka metadata ───────────────────────────────────────
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND

) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'receipts',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);
