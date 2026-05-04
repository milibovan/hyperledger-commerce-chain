CREATE TABLE request_approved_source (
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
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/approved',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_cancelled_source (
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
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/cancelled',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_created_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  trader_id      STRING,
  products       ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost     FLOAT,
  due_date       BIGINT,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/created',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_expired_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  due_date       BIGINT,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/expired',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_fulfilled_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  order_id       STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/fulfilled',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_pending_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/pending',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);

CREATE TABLE request_rejected_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  reason         STRING,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/raw/requests/rejected',
  'format'                  = 'avro',
  'source.monitor-interval' = '30s'
);