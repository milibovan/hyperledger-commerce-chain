SET sql-client.execution.result-mode=TABLEAU;

CREATE TABLE IF NOT EXISTS orders (
`common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,
  user_id     STRING,
  trader_id   STRING,
  reason      STRING,
  receipt_ids ARRAY<STRING>,
  products    ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost  FLOAT,
  request_id  STRING,
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'orders',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

CREATE TABLE IF NOT EXISTS receipts (
  `common` ROW<
    event_id       STRING NOT NULL,
    event_type     STRING NOT NULL,
    entity_id      STRING NOT NULL,
    entity_type    STRING NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING NOT NULL,
    causation_id   STRING NOT NULL
  > NOT NULL,
  user_id    STRING,
  trader_id  STRING,
  products   ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost FLOAT,
  due_date   BIGINT,
  reason     STRING,
  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'receipts',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-raw-zone-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

CREATE TABLE IF NOT EXISTS completed_orders (
  event_ts          TIMESTAMP,
  user_id           STRING,
  trader_id         STRING,
  total_cost        FLOAT,
  due_date          BIGINT,
  product_id        STRING,
  quantity          BIGINT,
  price             FLOAT,
  PRIMARY KEY (event_ts, user_id, trader_id, product_id) NOT ENFORCED 
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

-- Do any receipt entity_ids actually appear in any order's receipt_ids?
-- SELECT COUNT(*)
-- FROM orders oc, receipts rc
-- WHERE ARRAY_CONTAINS(oc.receipt_ids, rc.entity_id);

-- -- -- Spot check: what do entity_ids look like in receipts?
-- SELECT * FROM receipts WHERE entity_id IS NOT NULL LIMIT 20;

-- -- What do receipt_ids in orders look like?
-- SELECT receipt_ids FROM orders LIMIT 20;

-- -- What do entity_ids in receipts look like?
-- SELECT entity_id FROM receipts WHERE entity_id IS NOT NULL LIMIT 20;

EXECUTE STATEMENT SET
BEGIN
  INSERT INTO completed_orders
  SELECT
    event_ts, user_id, trader_id, total_cost, due_date, product_id, quantity, price
  FROM (
    SELECT
      oc.ts AS event_ts,
      oc.user_id,
      rc.trader_id,
      rc.total_cost,
      rc.due_date,
      rp.product_id,
      rp.quantity,
      rp.price,
      ROW_NUMBER() OVER (
        PARTITION BY oc.ts, oc.user_id, rc.total_cost, rc.trader_id
        ORDER BY oc.ts ASC
      ) AS rn
    FROM orders oc
    JOIN receipts rc ON ARRAY_CONTAINS(oc.receipt_ids, rc.`common`.entity_id)
      AND rc.`common`.entity_id IS NOT NULL
    CROSS JOIN UNNEST(rc.products) AS rp(product_id, quantity, price)
    WHERE
      oc.`common`.event_type = 'OrderCompleted'
      AND rc.`common`.event_type = 'ReceiptCreated'
      -- AND oc.ts > UNIX_TIMESTAMP() * 1000 - 86400000
      AND CAST(oc.ts AS DATE) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1' DAY)
      AND CAST(rc.ts AS DATE) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1' DAY)
      AND rc.`common`.entity_id IS NOT NULL
  )
  WHERE rn = 1;
END;