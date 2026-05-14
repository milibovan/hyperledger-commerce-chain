CREATE TABLE IF NOT EXISTS trader_created_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  email          STRING,
  trader_type    STRING,
  balance        FLOAT,
  vat            STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/traders/created',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS trader_deleted_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  dt             STRING
)  WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/traders/deleted',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);