-- =============================================================
-- FILE: sources/05_sources_order.sql
-- DESC: Kafka source table for the `orders` topic.
-- =============================================================

CREATE TABLE IF NOT EXISTS order_kafka_source (
  -- ── Envelope ──────────────────────────────────────────────
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,
    --   OrderApproved | OrderCancelled | OrderCompleted
    --   OrderCreated  | OrderFulfilled
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,

  -- ── Shared fields ─────────────────────────────────────────
  user_id     STRING,
  trader_id   STRING,
  reason      STRING,
  receipt_ids ARRAY<STRING>,
  products    ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost  FLOAT,
  request_id  STRING,

  -- ── Kafka metadata ───────────────────────────────────────
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND

) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'orders',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);
