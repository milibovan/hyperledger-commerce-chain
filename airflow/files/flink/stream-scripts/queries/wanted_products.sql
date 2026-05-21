SET sql-client.execution.result-mode=TABLEAU;

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
  'connector'                          = 'filesystem',
  'path'                               = 'hdfs://namenode:9000/datalake/transform/receipts/created',
  'format'                             = 'parquet',
  'source.monitor-interval'            = '1s'
);

CREATE TABLE IF NOT EXISTS receipt_created_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  dt         STRING
)  WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/receipts/created/products',
  'format'                                   = 'parquet',
  'source.monitor-interval'                  = '1s'
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
)  WITH (
  'connector'                          = 'filesystem',
  'path'                               = 'hdfs://namenode:9000/datalake/transform/requests/created',
  'format'                             = 'parquet',
  'source.monitor-interval'            = '1s'
);

CREATE TABLE IF NOT EXISTS request_created_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  dt         STRING
)  WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/requests/created/products',
  'format'                                   = 'parquet',
  'source.monitor-interval'                  = '1s'
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
  balance              FLOAT,
  event_time AS TO_TIMESTAMP_LTZ(
      COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
      3
  ),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/users/created',
  'format'                                   = 'parquet',
  'source.monitor-interval'                  = '1s'
);

CREATE TABLE IF NOT EXISTS wanted_products (
  sales_product_id      STRING,
  sales_growts_prc      DOUBLE,
  sales_coeff           DOUBLE,
  sales_users           BIGINT,
  demand_product_id     STRING,
  demand_growts_prc     DOUBLE,
  demand_coeff          DOUBLE,
  demand_users          BIGINT,
  total_coeff           DOUBLE,
  PRIMARY KEY (sales_product_id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
    'table-name' = 'wanted_products',
    'username' = 'postgres',
    'password' = '0Hf9Vnnxe3Cay5ZE',
    'driver' = 'org.postgresql.Driver',
    'sink.buffer-flush.max-rows' = '100',
    'sink.buffer-flush.interval' = '1s',
    'sink.max-retries' = '3'
);

EXECUTE STATEMENT SET
BEGIN
    INSERT INTO wanted_products

    WITH sales_hop AS (
        SELECT
            rcp.product_id,
            COUNT(*)                        AS total_sales,
            COUNT(DISTINCT rc.user_id)      AS unique_users,
            HOP_START(rc.event_time, INTERVAL '30' MINUTE, INTERVAL '1' HOUR) AS w_start,
            HOP_END(rc.event_time,   INTERVAL '30' MINUTE, INTERVAL '1' HOUR) AS w_end
        FROM receipt_created rc
        JOIN receipt_created_products rcp ON rcp.event_id = rc.event_id
        GROUP BY
            rcp.product_id,
            HOP(rc.event_time, INTERVAL '30' MINUTE, INTERVAL '1' HOUR)
    ),

    demand_hop AS (
        SELECT
            rcp.product_id,
            COUNT(*)                        AS total_requests,
            COUNT(DISTINCT rc.user_id)      AS unique_users,
            HOP_START(rc.event_time, INTERVAL '30' MINUTE, INTERVAL '1' HOUR) AS w_start,
            HOP_END(rc.event_time,   INTERVAL '30' MINUTE, INTERVAL '1' HOUR) AS w_end
        FROM request_created rc
        JOIN request_created_products rcp ON rcp.event_id = rc.event_id
        GROUP BY
            rcp.product_id,
            HOP(rc.event_time, INTERVAL '30' MINUTE, INTERVAL '1' HOUR)
    ),

    sales_growth AS (
        SELECT
            s_curr.product_id,
            s_curr.w_start,
            s_curr.total_sales,
            s_curr.unique_users,
            s_prev.total_sales                                  AS prev_sales,
            ROUND(
                (s_curr.total_sales - s_prev.total_sales)
                / NULLIF(CAST(s_prev.total_sales AS DOUBLE), 0) * 100.0
            , 2)                                                AS sales_growth_pct,
            ROUND(
                s_curr.total_sales / NULLIF(CAST(s_curr.unique_users AS DOUBLE), 0)
            , 4)                                                AS sales_coeff
        FROM sales_hop s_curr
        JOIN sales_hop s_prev
            ON  s_curr.product_id = s_prev.product_id
            AND s_curr.w_start    = s_prev.w_start + INTERVAL '30' MINUTE
    ),

    demand_growth AS (
        SELECT
            d_curr.product_id,
            d_curr.w_start,
            d_curr.total_requests,
            d_curr.unique_users,
            d_prev.total_requests                               AS prev_requests,
            ROUND(
                (d_curr.total_requests - d_prev.total_requests)
                / NULLIF(CAST(d_prev.total_requests AS DOUBLE), 0) * 100.0
            , 2)                                                AS demand_growth_pct,
            ROUND(
                d_curr.total_requests / NULLIF(CAST(d_curr.unique_users AS DOUBLE), 0)
            , 4)                                                AS demand_coeff
        FROM demand_hop d_curr
        JOIN demand_hop d_prev
            ON  d_curr.product_id = d_prev.product_id
            AND d_curr.w_start    = d_prev.w_start + INTERVAL '30' MINUTE
    ),

    combined AS (
        SELECT
            COALESCE(sg.product_id, dg.product_id)          AS product_id,
            sg.sales_growth_pct,
            sg.sales_coeff,
            sg.unique_users                                  AS sales_users,
            dg.demand_growth_pct,
            dg.demand_coeff,
            dg.unique_users                                  AS demand_users,
            ROUND(
                COALESCE(CAST(dg.total_requests AS DOUBLE), 0)
                / NULLIF(CAST(sg.total_sales AS DOUBLE), 0)
            , 4)                                             AS total_coeff
        FROM sales_growth sg
        FULL OUTER JOIN demand_growth dg
            ON  sg.product_id = dg.product_id
            AND sg.w_start    = dg.w_start
    )

    SELECT
        product_id      AS sales_product_id,
        sales_growth_pct AS sales_growts_prc,
        sales_coeff,
        sales_users,
        product_id      AS demand_product_id,
        demand_growth_pct AS demand_growts_prc,
        demand_coeff,
        demand_users,
        total_coeff
    FROM combined;

END;