from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "flink-jobmanager-1")
    t_env.get_config().set("rest.port", "8081")
    t_env.get_config().set("table.exec.io.use-parquet-native-reader", "false")
    t_env.get_config().set("table.exec.io.use-parquet-legacy-datetime-mapping", "true")

    t_env.execute_sql("""
        CREATE TABLE raw_receipts (
            `doc-type` STRING,
            id STRING,
            `trader-id` STRING,
            `user-id` STRING,
            `order-id` STRING,
            products ARRAY<ROW<product_id STRING, quantity INT>>,
            `date` STRING,
            `total-cost` DOUBLE,
            status STRING,
            `cancelled-date` STRING,
            `cancelled-by` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/receipts.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_users (
            id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/users_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_orders (
            id STRING,
            `user-id` STRING,
            status STRING
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
        CREATE TABLE transform_receipts (
            `doc-type` STRING,
            id STRING,
            `trader-id` STRING,
            `user-id` STRING,
            `order-id` STRING,
            `date` TIMESTAMP(3),
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            status STRING,
            `cancelled-date` TIMESTAMP(3),
            `cancelled-by` STRING,
            deleted BOOLEAN,
            product_count BIGINT,
            total_items INT,
            order_status STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/receipts_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_receipt_products (
            receipt_id STRING,
            product_id STRING,
            quantity INT,
            unit_price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/receipt_products.parquet',
            'format' = 'parquet'
        )
    """)

    # ── Step 1: explode + validate + write product lines ──────────────────────
    t_env.execute_sql("""
        INSERT INTO transform_receipt_products
        SELECT
            r.id AS receipt_id,
            prod.product_id,
            prod.quantity,
            COALESCE(p.price, 0.0) AS unit_price
        FROM raw_receipts r
        INNER JOIN valid_users vu   ON r.`user-id`  = vu.id
        INNER JOIN valid_traders vt ON r.`trader-id` = vt.id
        INNER JOIN valid_orders vo  ON r.`order-id`  = vo.id
        CROSS JOIN UNNEST(r.products) AS prod (product_id, quantity)
        LEFT JOIN valid_products p ON prod.product_id = p.id
        WHERE
            r.id IS NOT NULL
            AND CHAR_LENGTH(r.id) = 36
            AND r.id LIKE '%-%-%-%-%'
            AND vo.`user-id` = r.`user-id`
            AND vo.status IN ('COMPLETED', 'FULFILLED', 'APPROVED', 'PENDING', 'CANCELLED')
            AND r.status IN ('COMPLETED', 'CANCELLED', 'IN_PROGRESS')
            AND r.`total-cost` > 0
            AND r.deleted = false
    """).wait()

    # ── Step 2: read back flat product lines ──────────────────────────────────
    t_env.execute_sql("""
        CREATE TABLE receipt_products_flat (
            receipt_id STRING,
            product_id STRING,
            quantity INT,
            unit_price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/receipt_products.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TEMPORARY VIEW receipt_aggregates AS
        SELECT
            receipt_id,
            COUNT(DISTINCT product_id) AS product_count,
            SUM(quantity)              AS total_items,
            SUM(unit_price * quantity) AS calculated_cost
        FROM receipt_products_flat
        GROUP BY receipt_id
    """)

    # ── Step 3: write flat receipt headers ────────────────────────────────────
    t_env.execute_sql("""
        INSERT INTO transform_receipts
        SELECT
            r.`doc-type`,
            r.id,
            r.`trader-id`,
            r.`user-id`,
            r.`order-id`,
            TO_TIMESTAMP(
                REPLACE(REPLACE(r.`date`, 'T', ' '), 'Z', ''),
                'yyyy-MM-dd HH:mm:ss.SSS'
            ) AS `date`,
            r.`total-cost`,
            agg.calculated_cost                         AS `calculated-cost`,
            ABS(r.`total-cost` - agg.calculated_cost)  AS `cost-variance`,
            r.status,
            TO_TIMESTAMP(
                REPLACE(REPLACE(r.`cancelled-date`, 'T', ' '), 'Z', ''),
                'yyyy-MM-dd HH:mm:ss.SSS'
            ) AS `cancelled-date`,
            r.`cancelled-by`,
            r.deleted,
            agg.product_count,
            CAST(agg.total_items AS INT) AS total_items,
            vo.status                   AS order_status
        FROM raw_receipts r
        INNER JOIN valid_users vu   ON r.`user-id`  = vu.id
        INNER JOIN valid_traders vt ON r.`trader-id` = vt.id
        INNER JOIN valid_orders vo  ON r.`order-id`  = vo.id
        INNER JOIN receipt_aggregates agg ON r.id = agg.receipt_id
        WHERE
            r.id IS NOT NULL
            AND CHAR_LENGTH(r.id) = 36
            AND r.id LIKE '%-%-%-%-%'
            AND vo.`user-id` = r.`user-id`
            AND vo.status IN ('COMPLETED', 'FULFILLED', 'APPROVED', 'PENDING', 'CANCELLED')
            AND r.status IN ('COMPLETED', 'CANCELLED', 'IN_PROGRESS')
            AND r.`total-cost` > 0
            AND r.deleted = false
    """).wait()

    print("✅ Receipts transformation completed successfully!")

if __name__ == '__main__':
    run_transformation()