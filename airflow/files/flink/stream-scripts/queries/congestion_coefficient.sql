SET sql-client.execution.result-mode=TABLEAU;

CREATE TABLE IF NOT EXISTS orders_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  total_cost     FLOAT,
  request_id     STRING,
  dt             STRING,
  proc_time      AS PROCTIME()
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/orders/created',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS orders_approved (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  dt             STRING,
  proc_time      AS PROCTIME()
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/orders/approved',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS orders_fulfilled (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  trader_id      STRING,
  dt             STRING,
  proc_time      AS PROCTIME()
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/orders/fulfilled',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS orders_completed (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  receipt_ids    ARRAY<STRING>,
  dt             STRING,
  proc_time      AS PROCTIME()
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/orders/completed',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS congestion_coefficient (
  window_start           TIMESTAMP(3),
  window_end             TIMESTAMP(3),
  events_number          BIGINT,
  new_orders             BIGINT,
  finished_orders        BIGINT,
  congestion_coefficient FLOAT
) WITH (
  'connector'                  = 'jdbc',
  'url'                        = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
  'table-name'                 = 'congestion_coefficient',
  'username'                   = 'postgres',
  'password'                   = '0Hf9Vnnxe3Cay5ZE',
  'driver'                     = 'org.postgresql.Driver',
  'sink.buffer-flush.max-rows' = '100',
  'sink.buffer-flush.interval' = '1s',
  'sink.max-retries'           = '3'
);

CREATE TEMPORARY VIEW order_events AS
SELECT entity_id, proc_time, 'CREATED'   AS stage FROM orders_created
UNION ALL
SELECT entity_id, proc_time, 'APPROVED'  AS stage FROM orders_approved
UNION ALL
SELECT entity_id, proc_time, 'FULFILLED' AS stage FROM orders_fulfilled
UNION ALL
SELECT entity_id, proc_time, 'COMPLETED' AS stage FROM orders_completed;

EXECUTE STATEMENT SET
BEGIN
  INSERT INTO congestion_coefficient
  SELECT
    window_start,
    window_end,
    COUNT(*)                                                    AS events_number,
    COUNT(*) FILTER (WHERE stage IN ('CREATED', 'APPROVED'))    AS new_orders,
    COUNT(*) FILTER (WHERE stage IN ('FULFILLED', 'COMPLETED')) AS finished_orders,
    CASE
      WHEN COUNT(*) FILTER (WHERE stage IN ('FULFILLED', 'COMPLETED')) = 0
        THEN NULL
      ELSE
        CAST(COUNT(*) FILTER (WHERE stage IN ('CREATED', 'APPROVED')) AS FLOAT)
        /
        COUNT(*) FILTER (WHERE stage IN ('FULFILLED', 'COMPLETED'))
    END AS congestion_coefficient
  FROM TABLE(
    TUMBLE(TABLE order_events, DESCRIPTOR(proc_time), INTERVAL '1' MINUTE)
  )
  GROUP BY window_start, window_end;
END;