from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "jobmanager")
    t_env.get_config().set("rest.port", "8081")

    t_env.execute_sql("""
        CREATE TABLE raw_product_requests (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            `trader-id` STRING,
            `user-email` STRING,
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
            `created-date` STRING,
            `due-date` STRING,
            `total-cost` DOUBLE,
            status STRING,
            `order-id` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/order_requests.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_users (
            id STRING,
            email STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/users_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            id STRING,
            `trader-type` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_orders (
            id STRING,
            `user-id` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/orders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_products (
            id STRING,
            price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/products_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_product_requests (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            `trader-id` STRING,
            `user-email` STRING,
            `created-date` TIMESTAMP(3),
            `due-date` TIMESTAMP(3),
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            status STRING,
            `order-id` STRING,
            deleted BOOLEAN,
            product_count BIGINT,
            total_items INT,
            delivery_days INT,
            is_overdue BOOLEAN,
            trader_type STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/product_requests_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_product_request_products (
            request_id STRING,
            product_id STRING,
            quantity INT,
            unit_price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/product_request_products.parquet',
            'format' = 'parquet'
        )
    """)

    # ── Step 1: explode + validate + write product lines ──────────────────────
    t_env.execute_sql("""
        INSERT INTO transform_product_request_products
        SELECT
            pr.id AS request_id,
            prod.`product_id`,
            prod.quantity,
            COALESCE(p.price, 0.0) AS unit_price
        FROM raw_product_requests pr
        INNER JOIN valid_users vu ON pr.`user-id` = vu.id
        INNER JOIN valid_traders vt ON pr.`trader-id` = vt.id
        LEFT JOIN valid_orders vo ON pr.`order-id` = vo.id
        CROSS JOIN UNNEST(pr.products) AS prod (`product_id`, quantity)
        LEFT JOIN valid_products p ON prod.`product_id` = p.id
        WHERE
            pr.id IS NOT NULL
            AND CHAR_LENGTH(pr.id) = 36
            AND pr.status IN ('CREATED', 'PENDING_FUNDS', 'APPROVED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'CANCELED')
            AND pr.`total-cost` > 0
            AND pr.deleted = false
            AND (pr.status <> 'FULFILLED' OR (pr.status = 'FULFILLED' AND vo.id IS NOT NULL AND vo.`user-id` = pr.`user-id`))
    """).wait()

    # ── Step 2: read back flat product lines ──────────────────────────────────
    t_env.execute_sql("""
        CREATE TABLE product_request_products_flat (
            request_id STRING,
            product_id STRING,
            quantity INT,
            unit_price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/product_request_products.parquet',
            'format' = 'parquet'
        )
    """)

    # COUNT(DISTINCT) and SUM are both fine in GROUP BY
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW request_aggregates AS
        SELECT
            request_id,
            COUNT(DISTINCT product_id) AS product_count,
            SUM(quantity)              AS total_items,
            SUM(unit_price * quantity) AS calculated_cost
        FROM product_request_products_flat
        GROUP BY request_id
    """)

    # ── Step 3: write flat request headers ────────────────────────────────────
    t_env.execute_sql("""
        INSERT INTO transform_product_requests
        SELECT
            pr.`doc-type`,
            pr.id,
            pr.`user-id`,
            pr.`trader-id`,
            LOWER(TRIM(pr.`user-email`)) AS `user-email`,
            TO_TIMESTAMP(pr.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS `created-date`,
            TO_TIMESTAMP(pr.`due-date`,     'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS `due-date`,
            pr.`total-cost`,
            agg.calculated_cost                          AS `calculated-cost`,
            ABS(pr.`total-cost` - agg.calculated_cost)  AS `cost-variance`,
            pr.status,
            pr.`order-id`,
            pr.deleted,
            agg.product_count,
            CAST(agg.total_items AS INT)                 AS total_items,
            TIMESTAMPDIFF(
                DAY,
                TO_TIMESTAMP(pr.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z'''),
                TO_TIMESTAMP(pr.`due-date`,     'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
            ) AS delivery_days,
            CASE
                WHEN TO_TIMESTAMP(pr.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
                         < CAST(CURRENT_TIMESTAMP AS TIMESTAMP(3))
                     AND pr.status NOT IN ('FULFILLED', 'CANCELED', 'REJECTED')
                THEN true
                ELSE false
            END AS is_overdue,
            vt.`trader-type` AS trader_type
        FROM raw_product_requests pr
        INNER JOIN valid_users vu   ON pr.`user-id`  = vu.id
        INNER JOIN valid_traders vt ON pr.`trader-id` = vt.id
        LEFT JOIN  valid_orders vo  ON pr.`order-id`  = vo.id
        INNER JOIN request_aggregates agg ON pr.id = agg.request_id
        WHERE
            pr.id IS NOT NULL
            AND CHAR_LENGTH(pr.id) = 36
            AND pr.status IN ('CREATED', 'PENDING_FUNDS', 'APPROVED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'CANCELED')
            AND pr.`total-cost` > 0
            AND pr.deleted = false
            AND (pr.status <> 'FULFILLED' OR (pr.status = 'FULFILLED' AND vo.id IS NOT NULL AND vo.`user-id` = pr.`user-id`))
    """).wait()

    print("✅ Product Requests transformation completed successfully!")

if __name__ == '__main__':
    run_transformation()