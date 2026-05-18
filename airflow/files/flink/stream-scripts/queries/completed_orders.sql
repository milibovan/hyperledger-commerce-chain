SET sql-client.execution.result-mode=TABLEAU;

CREATE TABLE IF NOT EXISTS orders_completed (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  receipt_ids       ARRAY<STRING>,
  dt                STRING
) WITH (
  'connector'                          = 'filesystem',
  'path'                               = 'hdfs://namenode:9000/datalake/transform/orders/completed',
  'format'                             = 'parquet'
  -- 'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS receipt_created (
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
) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/receipts/created',
  'format'                                   = 'parquet',
  'source.path.regex-pattern' = '^(?!_)(?!.*\\.inprogress).*$'
  -- 'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS receipt_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  dt         STRING
) WITH (
  'connector'                             = 'filesystem',
  'path'                                  = 'hdfs://namenode:9000/datalake/transform/receipts/created/products',
  'format'                                = 'parquet'
  -- 'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS completed_orders (
  event_ts          BIGINT,
  user_id           STRING,
  trader_id         STRING,
  total_cost        FLOAT,
  due_date          BIGINT,
  product_id        STRING,
  quantity          BIGINT,
  price             FLOAT
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
    'table-name' = 'completed_orders',
    'username' = 'postgres',
    'password' = '0Hf9Vnnxe3Cay5ZE',
    'driver' = 'org.postgresql.Driver',
    'sink.buffer-flush.max-rows' = '100',
    'sink.buffer-flush.interval' = '1s',
    'sink.max-retries' = '3'
);

-- -- Do any receipt entity_ids actually appear in any order's receipt_ids?
-- SELECT COUNT(*)
-- FROM orders_completed oc, receipt_created rc
-- WHERE ARRAY_CONTAINS(oc.receipt_ids, rc.entity_id);

-- -- Spot check: what do receipt_ids actually look like?
-- SELECT receipt_ids FROM orders_completed LIMIT 5;

-- -- Spot check: what do entity_ids look like in receipt_created?
-- SELECT * FROM receipt_created WHERE entity_id IS NOT NULL LIMIT 20;

EXECUTE STATEMENT SET
BEGIN
  INSERT INTO completed_orders
  SELECT
    oc.event_ts,
    oc.user_id,
    rc.trader_id,
    rc.total_cost,
    rc.due_date,
    rp.product_id,
    rp.quantity,
    rp.price
  FROM orders_completed oc
  JOIN receipt_created  rc ON ARRAY_CONTAINS(oc.receipt_ids, rc.entity_id)
  JOIN receipt_products rp ON rc.event_id = rp.event_id
  WHERE oc.dt IN (
    DATE_FORMAT(NOW(), 'yyyy-MM-dd'),
    DATE_FORMAT(NOW() - INTERVAL '1' DAY, 'yyyy-MM-dd')
  )
  AND oc.event_ts > UNIX_TIMESTAMP() * 1000 - 86400000
  AND rc.entity_id IS NOT NULL;
END;