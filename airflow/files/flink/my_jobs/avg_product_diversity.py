from pyflink.table import EnvironmentSettings, TableEnvironment
import os

def run_transformation():
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    lib_dir = "/opt/flink/lib/"
    if os.path.exists(lib_dir):
        jars = [f"file://{os.path.join(lib_dir, jar)}" for jar in os.listdir(lib_dir) if jar.endswith(".jar")]
        jar_string = ";".join(jars)
        t_env.get_config().set("pipeline.jars", jar_string)
        t_env.get_config().set("pipeline.classpaths", jar_string)

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
        CREATE TABLE order_products (
            order_id STRING,
            product_id STRING,
            quantity INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/order_products.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_products (
            `doc-type` STRING,
            id STRING,
            name STRING,
            `expiry-date` TIMESTAMP(3),
            price DOUBLE,
            quantity INT,
            `trader-type` STRING,
            deleted BOOLEAN,
            has_expiry BOOLEAN,
            days_until_expiry INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/products_transformed.parquet',
            'format' = 'parquet'
        )
    """)
    
    t_env.execute_sql("""
        CREATE TABLE avg_product_diversity (
            category STRING,
            distinct_products BIGINT,
            total_orders_share DOUBLE
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'avg_product_diversity',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO avg_product_diversity
        WITH deduped_order_products AS (
            SELECT DISTINCT order_id, product_id
            FROM order_products
        ),
        eligible_orders AS (
            -- Single filtered CTE reused by both aggregation and grand-total
            SELECT o.id, o.product_count
            FROM transform_orders o
            WHERE o.deleted = FALSE
              AND o.`created-date` IS NOT NULL
        ),
        order_buckets AS (
            SELECT
                o.id,
                CASE
                    WHEN o.product_count = 1 THEN '1 product'
                    WHEN o.product_count BETWEEN 2 AND 5 THEN '2-5 products'
                    WHEN o.product_count BETWEEN 6 AND 10 THEN '6-10 products'
                    ELSE '10+ products'
                END AS category
            FROM eligible_orders o
        ),
        aggregated AS (
            -- Fix: count distinct ORDERS per bucket (not products).
            -- distinct_products was saturating at the pool size for every large bucket.
            SELECT
                category,
                COUNT(DISTINCT id) AS distinct_products
            FROM order_buckets
            GROUP BY category
        ),
        total AS (
            SELECT COUNT(DISTINCT id) AS grand_total
            FROM eligible_orders
        )
        SELECT
            a.category,
            a.distinct_products,
            CAST(a.distinct_products AS DOUBLE) / t.grand_total * 100 AS total_orders_share
        FROM aggregated a
        CROSS JOIN total t
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()