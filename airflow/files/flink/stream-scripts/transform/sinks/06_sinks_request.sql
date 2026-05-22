CREATE TABLE IF NOT EXISTS request_approved_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/approved',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_cancelled_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  reason         STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/cancelled',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_created_sink (
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
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/created',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

-- Exploded line-items from request_created_source.products[]
CREATE TABLE IF NOT EXISTS request_created_products_sink (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  event_ts   BIGINT,
  dt         STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/created/products',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_expired_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  due_date       BIGINT,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/expired',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_fulfilled_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  order_id       STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/fulfilled',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_pending_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/pending',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS request_rejected_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  reason         STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/requests/rejected',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);