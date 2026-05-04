CREATE TABLE IF NOT EXISTS receipt_created_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  trader_id      STRING,
  total_cost     FLOAT,
  due_date       BIGINT,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/receipts/created',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

-- Exploded line-items from receipt_created_source.products[]
CREATE TABLE IF NOT EXISTS receipt_products_sink (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  dt         STRING
) PARTITIONED BY (dt) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/receipts/created/products',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS receipt_cancelled_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/receipts/cancelled',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);