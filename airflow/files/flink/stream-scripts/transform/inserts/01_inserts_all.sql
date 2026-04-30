
EXECUTE STATEMENT SET
BEGIN
  ---------------USER-------------------------------------
  INSERT INTO user_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, `name`, surname, email, balance,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL
    AND email     IS NOT NULL
    AND balance   >= 0;

  INSERT INTO user_deleted_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, reason,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM user_deleted_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  ---------------TRADER-------------------------------------
  INSERT INTO trader_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, `name`, email, trader_type, balance, vat,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL
    AND email     IS NOT NULL
    AND vat       IS NOT NULL
    AND balance   >= 0;

  INSERT INTO trader_deleted_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, reason,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM trader_deleted_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  ---------------PRODUCT-------------------------------------
  INSERT INTO product_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, `name`, price, quantity, trader_type, expiry_date,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM product_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  INSERT INTO product_deleted_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM product_deleted_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  ---------------RECEIPT-------------------------------------
  INSERT INTO receipt_created_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, user_id, trader_id, products, total_cost, due_date,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM receipt_created_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

  INSERT INTO receipt_cancelled_sink
  SELECT
    event_id, entity_id, correlation_id, causation_id,
    event_ts, reason,
    DATE_FORMAT(event_time, 'yyyy-MM-dd') AS dt
  FROM receipt_cancelled_source
  WHERE event_id  IS NOT NULL
    AND entity_id IS NOT NULL;

END;