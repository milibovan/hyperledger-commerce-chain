CREATE TABLE IF NOT EXISTS trader_created_source (
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
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'filesystem',
  'path'                         = 'hdfs://namenode:9000/datalake/raw/traders/created',
  'format'                       = 'avro',
  'source.monitor-interval'      = '30s'
);

CREATE TABLE IF NOT EXISTS trader_deleted_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'filesystem',
  'path'                         = 'hdfs://namenode:9000/datalake/raw/traders/deleted',
  'format'                       = 'avro',
  'source.monitor-interval'      = '30s'
);