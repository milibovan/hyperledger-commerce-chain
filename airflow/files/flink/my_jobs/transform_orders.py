from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "jobmanager")
    t_env.get_config().set("rest.port", "8081")

    t_env.execute_sql("""
        CREATE TABLE raw_orders (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            status STRING,
            `created-date` STRING,
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
            `receipts-ids` ARRAY<STRING>,
            `total-cost` DOUBLE,
            `request-id` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/orders.jsonl',
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
        CREATE TABLE transform_orders (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            status STRING,
            `created-date` TIMESTAMP(3),
            `receipts-ids` ARRAY<STRING>,
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            `request-id` STRING,
            deleted BOOLEAN,
            product_count BIGINT NOT NULL,
            total_items INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/orders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_order_products (
            order_id STRING,
            product_id STRING,
            quantity INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/order_products.parquet',
            'format' = 'parquet'
        )
    """)

    # Step 1: filter valid orders first (no aggregation yet)
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW valid_raw_orders AS
        SELECT o.*
        FROM raw_orders o
        INNER JOIN valid_users vu ON o.`user-id` = vu.id
        WHERE
            o.id IS NOT NULL
            AND CHAR_LENGTH(o.id) = 36
            AND o.id LIKE '%-%-%-%-%'
            AND o.status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED', 'REJECTED')
            AND CARDINALITY(o.products) > 0
            AND o.`total-cost` > 0
            AND o.deleted = false
    """)

    # Step 2: explode products and join prices — scalar GROUP BY only, no array column
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW order_calculations AS
        SELECT
            o.id AS order_id,
            o.`user-id`,
            o.status,
            o.`created-date`,
            o.`receipts-ids`,
            o.`total-cost`,
            o.`request-id`,
            o.deleted,
            o.`doc-type`,
            prod.`product_id`,
            prod.quantity,
            SUM(p.price * prod.quantity) OVER (PARTITION BY o.id) AS calculated_cost,
            -- ✅ COUNT(DISTINCT) moved to a subquery, plain SUM used in window
            SUM(prod.quantity) OVER (PARTITION BY o.id) AS total_items,
            ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY o.`total-cost` DESC) AS rn
        FROM valid_raw_orders o
        CROSS JOIN UNNEST(o.products) AS prod (`product_id`, quantity)
        LEFT JOIN valid_products p ON prod.`product_id` = p.id
    """)

    # Step 3: compute product_count separately via GROUP BY (COUNT DISTINCT is fine here)
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW order_product_counts AS
        SELECT
            o.id AS order_id,
            COUNT(DISTINCT prod.`product_id`) AS product_count
        FROM valid_raw_orders o
        CROSS JOIN UNNEST(o.products) AS prod (`product_id`, quantity)
        GROUP BY o.id
    """)

    # Write flat order headers — join product_count back in
    t_env.execute_sql("""
        INSERT INTO transform_orders
        SELECT
            oc.`doc-type`,
            oc.order_id AS id,
            oc.`user-id`,
            oc.status,
            TO_TIMESTAMP(oc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS `created-date`,
            oc.`receipts-ids`,
            oc.`total-cost`,
            oc.calculated_cost AS `calculated-cost`,
            ABS(oc.`total-cost` - oc.calculated_cost) AS `cost-variance`,
            oc.`request-id`,
            oc.deleted,
            pc.product_count,
            CAST(oc.total_items AS INT)
        FROM order_calculations oc
        INNER JOIN order_product_counts pc ON oc.order_id = pc.order_id
        WHERE oc.rn = 1
    """).wait()

    # Write exploded product lines
    t_env.execute_sql("""
        INSERT INTO transform_order_products
        SELECT
            order_id,
            product_id,
            quantity
        FROM order_calculations
    """).wait()

    print("✅ Orders transformation completed successfully!")

if __name__ == '__main__':
    run_transformation()