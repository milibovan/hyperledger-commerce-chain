CREATE TABLE IF NOT EXISTS order_approved_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/orders/approved',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE IF NOT EXISTS order_cancelled_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  reason         STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/orders/cancelled',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE IF NOT EXISTS order_completed_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  reason         STRING,
  receipt_ids    ARRAY<STRING>,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/orders/completed',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE IF NOT EXISTS order_created_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost     FLOAT,
  request_id     STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/orders/created',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE IF NOT EXISTS order_fulfilled_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/orders/fulfilled',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);