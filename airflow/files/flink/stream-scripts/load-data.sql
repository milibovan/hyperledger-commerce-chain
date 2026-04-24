SET 'execution.checkpointing.interval' = '1min';
SET 'execution.checkpointing.mode' = 'EXACTLY_ONCE';

CREATE TABLE kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  `name`    STRING,
  surname   STRING,
  email     STRING,
  balance   FLOAT,
  reason    STRING,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'users',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for UserCreated events
CREATE TABLE hdfs_user_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  `name`         STRING,
  surname        STRING,
  email          STRING,
  balance        FLOAT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/users/created',
  'format'           = 'avro'
);

-- Sink for UserDeleted events
CREATE TABLE hdfs_user_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/users/deleted',
  'format'           = 'avro'
);

EXECUTE STATEMENT SET
BEGIN

  INSERT INTO hdfs_user_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    `name`,
    surname,
    email,
    balance,
    ts
  FROM kafka_source
  WHERE `common`.event_type = 'UserCreated';

  INSERT INTO hdfs_user_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    reason,
    ts
  FROM kafka_source
  WHERE `common`.event_type = 'UserDeleted';

END;