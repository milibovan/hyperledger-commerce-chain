SET 'execution.checkpointing.interval' = '1min';
SET 'execution.checkpointing.mode'     = 'EXACTLY_ONCE';
SET 'pipeline.name'                    = 'Inserting_into_transform_zone';

---------------USER-------------------------------------
CREATE TABLE user_created_source (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  surname        STRING,
  email          STRING,
  balance        FLOAT,
  event_time AS TO_TIMESTAMP(FROM_UNIXTIME(event_ts / 1000)),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'filesystem',
  'path'                         = 'hdfs://namenode:9000/datalake/raw/users/created',
  'format'                       = 'avro',
  'source.monitor-interval'      = '30s'
);

CREATE TABLE user_deleted_source (
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
  'path'                         = 'hdfs://namenode:9000/datalake/raw/users/deleted',
  'format'                       = 'avro',
  'source.monitor-interval'      = '30s'
);

CREATE TABLE user_created_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  surname        STRING,
  email          STRING,
  balance        DECIMAL(18, 4),
  dt             STRING  -- partition column
) PARTITIONED BY (dt) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/users/created',
  'format'                                   = 'parquet',
  'sink.rolling-policy.file-size'            = '128MB',
  'sink.rolling-policy.rollover-interval'    = '30 min',
  'sink.rolling-policy.check-interval'       = '1 min',
  'auto-compaction'                          = 'true',
  'compaction.file-size'                     = '128MB'
);

CREATE TABLE user_deleted_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/users/deleted',
  'format'                                   = 'parquet',
  'sink.rolling-policy.file-size'            = '128MB',
  'sink.rolling-policy.rollover-interval'    = '30 min',
  'sink.rolling-policy.check-interval'       = '1 min',
  'auto-compaction'                          = 'true',
  'compaction.file-size'                     = '128MB'
);
--------------------------------------------------------
---------------USER-------------------------------------

---------------TRADER-------------------------------------
CREATE TABLE trader_created_source (
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

CREATE TABLE trader_deleted_source (
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

CREATE TABLE trader_created_sink (
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
) PARTITIONED BY (dt) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/traders/created',
  'format'                                   = 'parquet',
  'sink.rolling-policy.file-size'            = '128MB',
  'sink.rolling-policy.rollover-interval'    = '30 min',
  'sink.rolling-policy.check-interval'       = '1 min',
  'auto-compaction'                          = 'true',
  'compaction.file-size'                     = '128MB'
);

CREATE TABLE trader_deleted_sink (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  dt             STRING
) PARTITIONED BY (dt) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/traders/deleted',
  'format'                                   = 'parquet',
  'sink.rolling-policy.file-size'            = '128MB',
  'sink.rolling-policy.rollover-interval'    = '30 min',
  'sink.rolling-policy.check-interval'       = '1 min',
  'auto-compaction'                          = 'true',
  'compaction.file-size'                     = '128MB'
);
----------------------------------------------------------
---------------TRADER-------------------------------------

EXECUTE STATEMENT SET
BEGIN
  ---------------USER-------------------------------------
  INSERT INTO user_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, `name`, surname, email, balance,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL
    AND email     IS NOT NULL
    AND balance   >= 0;

  INSERT INTO user_deleted_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, reason,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_deleted_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  ---------------USER-------------------------------------
  INSERT INTO trader_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, `name`, email, trader_type, balance, vat,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL
    AND email     IS NOT NULL
    AND vat       IS NOT NULL
    AND balance   >= 0;

  INSERT INTO trader_deleted_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, reason,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_deleted_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

END;