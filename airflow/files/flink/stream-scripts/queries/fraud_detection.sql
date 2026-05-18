SET sql-client.execution.result-mode=TABLEAU;

CREATE TABLE IF NOT EXISTS orders_cancelled (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  reason            STRING,
  dt                STRING
) WITH (
  'connector'                          = 'filesystem',
  'path'                               = 'hdfs://namenode:9000/datalake/transform/orders/cancelled',
  'format'                             = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS users_created (
  event_id             STRING,
  entity_id            STRING,
  correlation_id       STRING,
  causation_id         STRING,
  event_ts             BIGINT,
  `name`               STRING,
  surname              STRING,
  email                STRING,
  balance              FLOAT
) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/users/created',
  'format'                                   = 'parquet',
  'source.path.regex-pattern' = '^(?!_)(?!.*\\.inprogress).*$',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS fraud_detection (
  event_ts          BIGINT,
  user_id           STRING,
  user_name         STRING,
  user_surname      STRING,
  user_email        STRING,
  user_balance      FLOAT,
  PRIMARY KEY (user_id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
    'table-name' = 'fraud_detection',
    'username' = 'postgres',
    'password' = '0Hf9Vnnxe3Cay5ZE',
    'driver' = 'org.postgresql.Driver',
    'sink.buffer-flush.max-rows' = '100',
    'sink.buffer-flush.interval' = '1s',
    'sink.max-retries' = '3'
);

-- -- 1. Does the table have any data at all?
-- SELECT COUNT(*) FROM orders_cancelled;

-- -- 2. What dt values actually exist?
-- SELECT DISTINCT dt FROM orders_cancelled;

-- -- 3. What does NOW() produce right now?
-- SELECT DATE_FORMAT(NOW(), 'yyyy-MM-dd') AS today;

-- -- 4. Raw rows without any filter
-- SELECT * FROM orders_cancelled LIMIT 5;

EXECUTE STATEMENT SET
BEGIN
  INSERT INTO fraud_detection
  SELECT
    MAX(oc.event_ts)          AS event_ts,
    oc.user_id,
    uc.name,
    uc.surname,
    uc.email,
    uc.balance
  FROM orders_cancelled oc
  JOIN users_created uc
    ON oc.user_id = uc.entity_id
  WHERE oc.dt IN (
    DATE_FORMAT(NOW(), 'yyyy-MM-dd'),
    DATE_FORMAT(NOW() - INTERVAL '1' DAY, 'yyyy-MM-dd')
  )
  AND oc.event_ts > UNIX_TIMESTAMP() * 1000 - 300000
  GROUP BY
    oc.user_id,
    uc.name,
    uc.surname,
    uc.email,
    uc.balance
  HAVING
    COUNT(oc.event_id) > 3
    AND MAX(oc.event_ts) - MIN(oc.event_ts) < 300000;
END;