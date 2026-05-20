SET sql-client.execution.result-mode=TABLEAU;

CREATE TABLE IF NOT EXISTS orders_created (
  event_id              STRING,
  entity_id             STRING,
  correlation_id        STRING,
  causation_id          STRING,
  event_ts              BIGINT,
  user_id               STRING,
  total_cost            FLOAT,
  request_id            STRING,
  dt                    STRING,
  event_time AS TO_TIMESTAMP_LTZ(
        COALESCE(event_ts, UNIX_TIMESTAMP() * 1000),
        3
    ),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
  'connector'                          = 'filesystem',
  'path'                               = 'hdfs://namenode:9000/datalake/transform/orders/created',
  'format'                             = 'parquet',
  'source.monitor-interval'            = '1s'
);

CREATE TABLE IF NOT EXISTS order_created_products (
  event_id   STRING,
  product_id STRING,
  quantity   BIGINT,
  price      FLOAT,
  dt         STRING
)  WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/orders/created/products',
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
  balance              FLOAT
) WITH (
  'connector'                                = 'filesystem',
  'path'                                     = 'hdfs://namenode:9000/datalake/transform/users/created',
  'format'                                   = 'parquet',
  'source.path.regex-pattern' = '^(?!_)(?!.*\\.inprogress).*$',
  'source.monitor-interval' = '1s'
);

select * from orders_created LIMIT 20;

CREATE TABLE IF NOT EXISTS whale_orders (
  entity_id     STRING,
  user_id       STRING,
  user_name     STRING,
  user_surname  STRING,
  user_email    STRING,
  user_balance  FLOAT,
  total_cost    FLOAT,
  product_id    STRING,
  quantity      BIGINT,
  price         FLOAT,
  PRIMARY KEY (entity_id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
    'table-name' = 'whale_orders',
    'username' = 'postgres',
    'password' = '0Hf9Vnnxe3Cay5ZE',
    'driver' = 'org.postgresql.Driver',
    'sink.buffer-flush.max-rows' = '100',
    'sink.buffer-flush.interval' = '1s',
    'sink.max-retries' = '3'
);

EXECUTE STATEMENT SET
BEGIN
    INSERT INTO whale_orders
    SELECT
        entity_id,
        user_id,
        `name`,
        surname,
        email,
        balance,
        total_cost,
        product_id,
        quantity,
        price
    FROM (
        SELECT
            oc.entity_id,
            oc.user_id,
            uc.`name`,
            uc.surname,
            uc.email,
            uc.balance,
            oc.total_cost,
            ocp.product_id,
            ocp.quantity,
            ocp.price,
            ROW_NUMBER() OVER (
            PARTITION BY oc.entity_id
            ORDER BY oc.event_time ASC
            ) AS row_num
        FROM orders_created oc
        JOIN order_created_products ocp ON ocp.event_id = oc.event_id
        JOIN users_created uc ON uc.entity_id = oc.user_id
        WHERE oc.total_cost > 10000
    )
    WHERE row_num = 1;
END;