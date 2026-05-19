EXECUTE STATEMENT SET
BEGIN

  -- =========================================================
  -- USER
  -- =========================================================
  INSERT INTO user_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, `name`, surname, email, balance,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL
    AND email IS NOT NULL AND balance >= 0;

  INSERT INTO user_deleted_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_deleted_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  -- =========================================================
  -- TRADER
  -- =========================================================
  INSERT INTO trader_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, `name`, email, trader_type, balance, vat,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL
    AND email IS NOT NULL AND vat IS NOT NULL AND balance >= 0;

  INSERT INTO trader_deleted_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_deleted_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  -- =========================================================
  -- PRODUCT
  -- =========================================================
  INSERT INTO product_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, `name`, price, quantity, trader_type, expiry_date,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM product_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO product_deleted_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM product_deleted_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  -- =========================================================
  -- RECEIPT
  -- =========================================================
  INSERT INTO receipt_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, trader_id, total_cost, due_date,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM receipt_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO receipt_products_sink
  SELECT r.event_id, prod.product_id, prod.quantity, prod.price,
         DATE_FORMAT(r.event_time, 'yyyy-MM-dd') AS dt
  FROM receipt_created_source r
  CROSS JOIN UNNEST(r.products) AS prod (product_id, quantity, price)
  WHERE r.event_id IS NOT NULL AND r.entity_id IS NOT NULL AND r.event_ts IS NOT NULL;

  INSERT INTO receipt_cancelled_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM receipt_cancelled_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  -- =========================================================
  -- ORDER
  -- =========================================================
  INSERT INTO order_approved_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, trader_id,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM order_approved_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO order_cancelled_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM order_cancelled_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO order_completed_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, receipt_ids,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM order_completed_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO order_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, total_cost, request_id,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM order_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO order_created_products_sink
  SELECT r.event_id, prod.product_id, prod.quantity, prod.price,
         DATE_FORMAT(r.event_time, 'yyyy-MM-dd') AS dt
  FROM order_created_source r
  CROSS JOIN UNNEST(r.products) AS prod (product_id, quantity, price)
  WHERE r.event_id IS NOT NULL AND r.entity_id IS NOT NULL AND r.event_ts IS NOT NULL;

  INSERT INTO order_fulfilled_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, trader_id,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM order_fulfilled_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL AND event_ts IS NOT NULL;

  INSERT INTO order_fulfilled_products_sink
  SELECT r.event_id, prod.product_id, prod.quantity, prod.price,
         DATE_FORMAT(r.event_time, 'yyyy-MM-dd') AS dt
  FROM order_fulfilled_source r
  CROSS JOIN UNNEST(r.products) AS prod (product_id, quantity, price)
  WHERE r.event_id IS NOT NULL AND r.entity_id IS NOT NULL AND r.event_ts IS NOT NULL;

  -- =========================================================
  -- REQUEST
  -- =========================================================
  INSERT INTO request_approved_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, trader_id,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_approved_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_cancelled_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_cancelled_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_created_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, user_id, trader_id, total_cost, due_date,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_created_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_created_products_sink
  SELECT r.event_id, prod.product_id, prod.quantity, prod.price,
         DATE_FORMAT(r.event_time, 'yyyy-MM-dd') AS dt
  FROM request_created_source r
  CROSS JOIN UNNEST(r.products) AS prod (product_id, quantity, price)
  WHERE r.event_id IS NOT NULL AND r.entity_id IS NOT NULL;

  INSERT INTO request_expired_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, due_date,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_expired_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_fulfilled_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, trader_id, order_id,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_fulfilled_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_pending_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_pending_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

  INSERT INTO request_rejected_sink
  SELECT event_id, entity_id, correlation_id, causation_id,
         event_ts, trader_id, reason,
         DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM request_rejected_source
  WHERE event_id IS NOT NULL AND entity_id IS NOT NULL;

END;