SET sql-client.execution.result-mode=TABLEAU;
SET 'pipeline.name' = '01_wanted_products';

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
  dt             STRING,
  event_time AS TO_TIMESTAMP_LTZ(
      COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
      3
  ),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/receipts/created',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS receipt_created_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  event_ts   BIGINT,
  dt         STRING,
  event_time AS TO_TIMESTAMP_LTZ(
      COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
      3
  ),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/receipts/created/products',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS request_created (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  user_id        STRING,
  trader_id      STRING,
  total_cost     FLOAT,
  due_date       BIGINT,
  dt             STRING,
  event_time AS TO_TIMESTAMP_LTZ(
      COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
      3
  ),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/requests/created',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS request_created_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  event_ts   BIGINT,
  dt         STRING,
  event_time AS TO_TIMESTAMP_LTZ(
      COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
      3
  ),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'               = 'filesystem',
  'path'                    = 'hdfs://namenode:9000/datalake/transform/requests/created/products',
  'format'                  = 'parquet',
  'source.monitor-interval' = '1s'
);

CREATE TABLE IF NOT EXISTS sales_hop_materialized_sink (
  product_id    STRING,
  total_sales   BIGINT,
  total_revenue FLOAT,
  w_start       TIMESTAMP(3),
  w_end         TIMESTAMP(3),
  PRIMARY KEY (product_id, w_start) NOT ENFORCED
) WITH (
  'connector'                  = 'jdbc',
  'url'                        = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
  'table-name'                 = 'sales_hop_materialized',
  'username'                   = 'postgres',
  'password'                   = '0Hf9Vnnxe3Cay5ZE',
  'driver'                     = 'org.postgresql.Driver',
  'sink.buffer-flush.max-rows' = '100',
  'sink.buffer-flush.interval' = '1s',
  'sink.max-retries'           = '3'
);

CREATE TABLE IF NOT EXISTS demand_hop_materialized (
  product_id     STRING,
  total_requests BIGINT,
  w_start        TIMESTAMP(3),
  w_end          TIMESTAMP(3),
  PRIMARY KEY (product_id, w_start) NOT ENFORCED
) WITH (
  'connector'                  = 'jdbc',
  'url'                        = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
  'table-name'                 = 'demand_hop_materialized',
  'username'                   = 'postgres',
  'password'                   = '0Hf9Vnnxe3Cay5ZE',
  'driver'                     = 'org.postgresql.Driver',
  'sink.buffer-flush.max-rows' = '100',
  'sink.buffer-flush.interval' = '1s',
  'sink.max-retries'           = '3'
);

EXECUTE STATEMENT SET
BEGIN
  INSERT INTO sales_hop_materialized
  SELECT
    rcp.product_id,
    COUNT(*)                      AS total_sales,
    SUM(rcp.price * rcp.quantity) AS total_revenue,
    HOP_START(rc.event_time, INTERVAL '30' SECOND, INTERVAL '1' HOUR) AS w_start,
    HOP_END(rc.event_time,   INTERVAL '30' SECOND, INTERVAL '1' HOUR) AS w_end
  FROM receipt_created rc
  JOIN receipt_created_products rcp ON rcp.event_id = rc.event_id
  GROUP BY
    rcp.product_id,
    HOP(rc.event_time, INTERVAL '30' SECOND, INTERVAL '1' HOUR);

  INSERT INTO demand_hop_materialized
  SELECT
    rcp.product_id,
    COUNT(*)                   AS total_requests,
    HOP_START(rc.event_time, INTERVAL '30' SECOND, INTERVAL '1' HOUR) AS w_start,
    HOP_END(rc.event_time,   INTERVAL '30' SECOND, INTERVAL '1' HOUR) AS w_end
  FROM request_created rc
  JOIN request_created_products rcp ON rcp.event_id = rc.event_id
  GROUP BY
    rcp.product_id,
    HOP(rc.event_time, INTERVAL '30' SECOND, INTERVAL '1' HOUR);
END;