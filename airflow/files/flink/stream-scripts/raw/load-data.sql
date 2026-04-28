SET 'execution.checkpointing.interval' = '1min';
SET 'execution.checkpointing.mode' = 'EXACTLY_ONCE';
SET 'pipeline.name' = 'Inserting_into_raw_zone';

---------------USER-------------------------------------

CREATE TABLE user_kafka_source (
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

--------------------------------------------------------
---------------USER-------------------------------------

---------------TRADER-------------------------------------
CREATE TABLE trader_kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  `name`      STRING,
  email       STRING,
  trader_type STRING,
  balance     FLOAT,
  vat         STRING,
  reason      STRING,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'traders',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for TraderCreated events
CREATE TABLE hdfs_trader_created (
  event_id        STRING,
  entity_id       STRING,
  correlation_id  STRING,
  causation_id    STRING,
  event_ts        BIGINT,
  `name`          STRING,
  email           STRING,
  trader_type     STRING,
  balance         FLOAT,
  vat             STRING,
  kafka_ts        TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/traders/created',
  'format'           = 'avro'
);

-- Sink for TraderDeleted events
CREATE TABLE hdfs_trader_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  reason         STRING,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/traders/deleted',
  'format'           = 'avro'
);
----------------------------------------------------------
---------------TRADER-------------------------------------

---------------PRODUCT-------------------------------------
CREATE TABLE product_kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  `name`      STRING,
  price       FLOAT,
  quantity    BIGINT,
  trader_type STRING,
  expiry_date BIGINT,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'products',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for ProductCreated events
CREATE TABLE hdfs_product_created (
  event_id        STRING,
  entity_id       STRING,
  correlation_id  STRING,
  causation_id    STRING,
  event_ts        BIGINT,
  `name`          STRING,
  price           FLOAT,
  quantity        BIGINT,
  trader_type     STRING,
  expiry_date     BIGINT,
  kafka_ts        TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/products/created',
  'format'           = 'avro'
);

-- Sink for ProductDeleted events
CREATE TABLE hdfs_product_deleted (
  event_id       STRING,
  entity_id      STRING,
  correlation_id STRING,
  causation_id   STRING,
  event_ts       BIGINT,
  kafka_ts       TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/products/deleted',
  'format'           = 'avro'
);

----------------------------------------------------------
---------------PRODUCT------------------------------------

---------------RECEIPT------------------------------------
CREATE TABLE receipt_kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  user_id           STRING,
  trader_id         STRING,
  products ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  due_date          BIGINT,
  reason            STRING,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'receipts',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for ReceiptCreated events
CREATE TABLE hdfs_receipt_created (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  trader_id         STRING,
  products ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  due_date          BIGINT,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/receipts/created',
  'format'           = 'avro'
);

-- Sink for ReceiptCancelled events
CREATE TABLE hdfs_receipt_cancelled (
  event_id            STRING,
  entity_id           STRING,
  correlation_id      STRING,
  causation_id        STRING,
  event_ts            BIGINT,
  reason              STRING,
  kafka_ts            TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/receipts/cancelled',
  'format'           = 'avro'
);
----------------------------------------------------------
---------------RECEIPT------------------------------------

---------------ORDER------------------------------------
CREATE TABLE order_kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  user_id           STRING,
  trader_id         STRING,
  reason            STRING,
  receipt_ids       ARRAY<STRING>,
  products          ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  request_id        STRING,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'orders',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for OrderApproved events
CREATE TABLE hdfs_order_approved (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  trader_id         STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/orders/approved',
  'format'           = 'avro'
);

-- Sink for OrderCancelled events
CREATE TABLE hdfs_order_cancelled (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  reason            STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/orders/cancelled',
  'format'           = 'avro'
);

-- Sink for OrderCompleted events
CREATE TABLE hdfs_order_completed (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  receipt_ids       ARRAY<STRING>,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/orders/completed',
  'format'           = 'avro'
);

-- Sink for OrderCreated events
CREATE TABLE hdfs_order_created (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  products          ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  request_id        STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/orders/created',
  'format'           = 'avro'
);

-- Sink for OrderFulfilled events
CREATE TABLE hdfs_order_fulfilled (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  trader_id         STRING,
  products          ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/orders/fulfilled',
  'format'           = 'avro'
);
----------------------------------------------------------
---------------ORDER--------------------------------------

---------------REQUEST------------------------------------
CREATE TABLE request_kafka_source (
  `common` ROW <
    event_id       STRING     NOT NULL,
    event_type     STRING     NOT NULL,
    entity_id      STRING     NOT NULL,
    entity_type    STRING     NOT NULL,
    `timestamp`    BIGINT,
    correlation_id STRING     NOT NULL,
    causation_id   STRING     NOT NULL
  > NOT NULL,
  user_id           STRING,
  trader_id         STRING,
  order_id          STRING,
  reason            STRING,
  products          ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  due_date          BIGINT,
  request_id        STRING,

  ts TIMESTAMP(3) METADATA FROM 'timestamp',
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
  'connector'                    = 'kafka',
  'topic'                        = 'requests',
  'properties.bootstrap.servers' = 'kafka1:9092,kafka2:9092,kafka3:9092',
  'properties.group.id'          = 'flink-typed-consumer',
  'scan.startup.mode'            = 'earliest-offset',
  'value.format'                 = 'avro-confluent',
  'value.avro-confluent.url'     = 'http://schema-registry:8081'
);

-- Sink for RequestApproved events
CREATE TABLE hdfs_request_approved (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  trader_id         STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/approved',
  'format'           = 'avro'
);

-- Sink for RequestCancelled events
CREATE TABLE hdfs_request_cancelled (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  reason            STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/cancelled',
  'format'           = 'avro'
);

-- Sink for RequestCreated events
CREATE TABLE hdfs_request_created (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  user_id           STRING,
  trader_id         STRING,
  products          ARRAY<ROW<product_id STRING, quantity BIGINT, price FLOAT>>,
  total_cost        FLOAT,
  due_date          BIGINT,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/created',
  'format'           = 'avro'
);

-- Sink for RequestExpired events
CREATE TABLE hdfs_request_expired (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  due_date          BIGINT,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/expired',
  'format'           = 'avro'
);

-- Sink for RequestFulfilled events
CREATE TABLE hdfs_request_fulfilled (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  trader_id         STRING,
  order_id          STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/fulfilled',
  'format'           = 'avro'
);

-- Sink for RequestPending events
CREATE TABLE hdfs_request_pending (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/pending',
  'format'           = 'avro'
);

-- Sink for RequestRejected events
CREATE TABLE hdfs_request_rejected (
  event_id          STRING,
  entity_id         STRING,
  correlation_id    STRING,
  causation_id      STRING,
  event_ts          BIGINT,
  trader_id         STRING,
  reason            STRING,
  kafka_ts          TIMESTAMP(3)
) WITH (
  'connector'        = 'filesystem',
  'path'             = 'hdfs://namenode:9000/datalake/raw/requests/rejected',
  'format'           = 'avro'
);
----------------------------------------------------------
---------------REQUEST--------------------------------------

EXECUTE STATEMENT SET
BEGIN

  ---------------USER-------------------------------------
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
  FROM user_kafka_source
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
  FROM user_kafka_source
  WHERE `common`.event_type = 'UserDeleted';

  
  ---------------TRADER-------------------------------------
  INSERT INTO hdfs_trader_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    `name`,
    email,
    trader_type,
    balance,
    vat,
    ts
  FROM trader_kafka_source
  WHERE `common`.event_type = 'TraderCreated';

  INSERT INTO hdfs_trader_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    reason,
    ts
  FROM trader_kafka_source
  WHERE `common`.event_type = 'TraderDeleted';

  ---------------PRODUCT-------------------------------------
  INSERT INTO hdfs_product_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    `name`,
    price,
    quantity,
    trader_type,
    expiry_date,
    ts
  FROM product_kafka_source
  WHERE `common`.event_type = 'ProductCreated';

  INSERT INTO hdfs_product_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    ts
  FROM product_kafka_source
  WHERE `common`.event_type = 'ProductDeleted';

  ---------------RECEIPT-------------------------------------
  INSERT INTO hdfs_receipt_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  trader_id,
  products,
  total_cost,
  due_date,
  ts
  FROM receipt_kafka_source
  WHERE `common`.event_type = 'ReceiptCreated';

  INSERT INTO hdfs_receipt_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
    reason,
    ts
  FROM receipt_kafka_source
  WHERE `common`.event_type = 'ReceiptCancelled';

  ---------------ORDER-------------------------------------
  INSERT INTO hdfs_order_approved
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  trader_id,
  ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderApproved';

  INSERT INTO hdfs_order_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  reason,
  ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCancelled';

  INSERT INTO hdfs_order_completed
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  receipt_ids,
  ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCompleted';

  INSERT INTO hdfs_order_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  products,
  total_cost,
  request_id,
  ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCreated';

  INSERT INTO hdfs_order_fulfilled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  trader_id,
  products,
  ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderFulfilled';

  ---------------REQUEST-------------------------------------
  INSERT INTO hdfs_request_approved
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  trader_id,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestApproved';

  INSERT INTO hdfs_request_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  reason,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestCancelled';

  INSERT INTO hdfs_request_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  user_id,
  trader_id,
  products,
  total_cost,
  due_date,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestCreated';

  INSERT INTO hdfs_request_expired
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  due_date,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestExpired';

  INSERT INTO hdfs_request_fulfilled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  trader_id,
  order_id,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestFulfilled';

  INSERT INTO hdfs_request_pending
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestPending';

  INSERT INTO hdfs_request_rejected
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`,
  trader_id,
  reason,
  ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestRejected';

END;