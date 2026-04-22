CREATE TABLE kafka_source (
  user_id STRING,
  event_type STRING,
  payload STRING,
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'traders',
    'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
    'properties.group.id' = 'testGroup',
    'scan.startup.mode' = 'earliest-offset',
    'format' = 'avro-confluent',
    'avro-confluent.url' = 'http://schema-registry:8081'
);

CREATE TABLE raw_sink (
  user_id STRING,
  event_type STRING,
  payload STRING,
  ts TIMESTAMP(3)
) WITH (
  'connector' = 'filesystem',
  'path' = 'hdfs://namenode:9000/datalake/raw/',
  'format' = 'avro'
);

INSERT INTO raw_sink SELECT * FROM kafka_source;