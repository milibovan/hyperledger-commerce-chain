-- Shared sink options (128 MB rolling, 30-min rollover, auto-compaction)
-- replicated inline per table as Flink SQL does not support variable substitution.

CREATE TABLE IF NOT EXISTS user_created_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  surname        STRING,
  email          STRING,
  balance        FLOAT,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/users/created',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);

CREATE TABLE IF NOT EXISTS user_deleted_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/users/deleted',
  'format'                                = 'parquet',
  'sink.rolling-policy.file-size'         = '128MB',
  'sink.rolling-policy.rollover-interval' = '30 min',
  'sink.rolling-policy.check-interval'    = '1 min',
  'auto-compaction'                       = 'true',
  'compaction.file-size'                  = '128MB'
);