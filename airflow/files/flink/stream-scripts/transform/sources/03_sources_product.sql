CREATE TABLE IF NOT EXISTS product_created_source (
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
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/products/created',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE IF NOT EXISTS product_deleted_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/products/deleted',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);