-- =============================================================
-- FILE: inserts/01_inserts_all.sql
-- DESC: Routes every Kafka event to its HDFS sink partition.
--
--       All statements run inside a single EXECUTE STATEMENT SET
--       so Flink compiles them into ONE job graph, sharing source
--       operators and producing a single checkpoint barrier train.
--
--       Execution order of this file assumes DDL has already run:
--         00_pipeline_config.sql
--         sources/01..06_sources_*.sql
--         sinks/01..06_sinks_*.sql
-- =============================================================

EXECUTE STATEMENT SET
BEGIN

  -- ===========================================================
  -- DOMAIN: USER
  -- Source topic : users
  -- Event types  : UserCreated | UserDeleted
  -- ===========================================================

  -- Route: UserCreated → HDFS raw/users/created
  INSERT INTO hdfs_user_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    `name`,
    surname,
    email,
    balance,
    ts                    AS kafka_ts
  FROM user_kafka_source
  WHERE `common`.event_type = 'UserCreated';

  -- Route: UserDeleted → HDFS raw/users/deleted
  INSERT INTO hdfs_user_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    reason,
    ts                    AS kafka_ts
  FROM user_kafka_source
  WHERE `common`.event_type = 'UserDeleted';

  -- ===========================================================
  -- DOMAIN: TRADER
  -- Source topic : traders
  -- Event types  : TraderCreated | TraderDeleted
  -- ===========================================================

  -- Route: TraderCreated → HDFS raw/traders/created
  INSERT INTO hdfs_trader_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    `name`,
    email,
    trader_type,
    balance,
    vat,
    ts                    AS kafka_ts
  FROM trader_kafka_source
  WHERE `common`.event_type = 'TraderCreated';

  -- Route: TraderDeleted → HDFS raw/traders/deleted
  INSERT INTO hdfs_trader_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    reason,
    ts                    AS kafka_ts
  FROM trader_kafka_source
  WHERE `common`.event_type = 'TraderDeleted';

  -- ===========================================================
  -- DOMAIN: PRODUCT
  -- Source topic : products
  -- Event types  : ProductCreated | ProductDeleted
  -- ===========================================================

  -- Route: ProductCreated → HDFS raw/products/created
  INSERT INTO hdfs_product_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    `name`,
    price,
    quantity,
    trader_type,
    expiry_date,
    ts                    AS kafka_ts
  FROM product_kafka_source
  WHERE `common`.event_type = 'ProductCreated';

  -- Route: ProductDeleted → HDFS raw/products/deleted
  INSERT INTO hdfs_product_deleted
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    ts                    AS kafka_ts
  FROM product_kafka_source
  WHERE `common`.event_type = 'ProductDeleted';

  -- ===========================================================
  -- DOMAIN: RECEIPT
  -- Source topic : receipts
  -- Event types  : ReceiptCreated | ReceiptCancelled
  -- ===========================================================

  -- Route: ReceiptCreated → HDFS raw/receipts/created
  INSERT INTO hdfs_receipt_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    trader_id,
    products,
    total_cost,
    due_date,
    ts                    AS kafka_ts
  FROM receipt_kafka_source
  WHERE `common`.event_type = 'ReceiptCreated';

  -- Route: ReceiptCancelled → HDFS raw/receipts/cancelled
  INSERT INTO hdfs_receipt_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    reason,
    ts                    AS kafka_ts
  FROM receipt_kafka_source
  WHERE `common`.event_type = 'ReceiptCancelled';

  -- ===========================================================
  -- DOMAIN: ORDER
  -- Source topic : orders
  -- Event types  : OrderApproved | OrderCancelled | OrderCompleted
  --                OrderCreated  | OrderFulfilled
  -- ===========================================================

  -- Route: OrderApproved → HDFS raw/orders/approved
  INSERT INTO hdfs_order_approved
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    trader_id,
    ts                    AS kafka_ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderApproved';

  -- Route: OrderCancelled → HDFS raw/orders/cancelled
  INSERT INTO hdfs_order_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    reason,
    ts                    AS kafka_ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCancelled';

  -- Route: OrderCompleted → HDFS raw/orders/completed
  INSERT INTO hdfs_order_completed
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    receipt_ids,
    ts                    AS kafka_ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCompleted';

  -- Route: OrderCreated → HDFS raw/orders/created
  INSERT INTO hdfs_order_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    products,
    total_cost,
    request_id,
    ts                    AS kafka_ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderCreated';

  -- Route: OrderFulfilled → HDFS raw/orders/fulfilled
  INSERT INTO hdfs_order_fulfilled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    trader_id,
    products,
    ts                    AS kafka_ts
  FROM order_kafka_source
  WHERE `common`.event_type = 'OrderFulfilled';

  -- ===========================================================
  -- DOMAIN: REQUEST
  -- Source topic : requests
  -- Event types  : RequestApproved | RequestCancelled | RequestCreated
  --                RequestExpired  | RequestFulfilled | RequestPending
  --                RequestRejected
  -- ===========================================================

  -- Route: RequestApproved → HDFS raw/requests/approved
  INSERT INTO hdfs_request_approved
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    trader_id,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestApproved';

  -- Route: RequestCancelled → HDFS raw/requests/cancelled
  INSERT INTO hdfs_request_cancelled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    reason,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestCancelled';

  -- Route: RequestCreated → HDFS raw/requests/created
  INSERT INTO hdfs_request_created
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    user_id,
    trader_id,
    products,
    total_cost,
    due_date,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestCreated';

  -- Route: RequestExpired → HDFS raw/requests/expired
  INSERT INTO hdfs_request_expired
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    due_date,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestExpired';

  -- Route: RequestFulfilled → HDFS raw/requests/fulfilled
  INSERT INTO hdfs_request_fulfilled
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    trader_id,
    order_id,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestFulfilled';

  -- Route: RequestPending → HDFS raw/requests/pending
  INSERT INTO hdfs_request_pending
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestPending';

  -- Route: RequestRejected → HDFS raw/requests/rejected
  INSERT INTO hdfs_request_rejected
  SELECT
    `common`.event_id,
    `common`.entity_id,
    `common`.correlation_id,
    `common`.causation_id,
    `common`.`timestamp`  AS event_ts,
    trader_id,
    reason,
    ts                    AS kafka_ts
  FROM request_kafka_source
  WHERE `common`.event_type = 'RequestRejected';

END;
