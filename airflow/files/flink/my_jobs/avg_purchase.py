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
            id STRING,
            `created-date` TIMESTAMP(3),
            `receipts-ids` ARRAY<STRING>,
            `total-cost` DOUBLE,
            deleted BOOLEAN,
            product_count BIGINT,
            total_items INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/orders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_receipts (
            id STRING,
            `order-id` STRING,
            deleted BOOLEAN,
            product_count BIGINT,
            total_items INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/receipts_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE avg_purchase (
            `month` STRING,
            `avg_orders_created` DOUBLE,
            `avg_receipts_per_order` DOUBLE,
            `avg_products_per_order` DOUBLE,
            `avg_product_quantity_per_order` DOUBLE,
            `avg_products_per_receipt` DOUBLE,
            `avg_product_quantity_per_receipt` DOUBLE,
            `avg_price` DOUBLE,
            PRIMARY KEY (`month`) NOT ENFORCED
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'avg_purchase',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO avg_purchase
        SELECT
            DATE_FORMAT(o.`created-date`, 'yyyy-MM') AS `month`,
            CAST(COUNT(DISTINCT o.id) AS DOUBLE) AS avg_orders_created,
            CAST(COUNT(DISTINCT r.id) AS DOUBLE) / CAST(COUNT(DISTINCT o.id) AS DOUBLE) AS avg_receipts_per_order,
            CAST(SUM(o.product_count) AS DOUBLE) / CAST(COUNT(DISTINCT o.id) AS DOUBLE) AS avg_products_per_order,
            CAST(SUM(o.total_items) AS DOUBLE) / CAST(COUNT(DISTINCT o.id) AS DOUBLE) AS avg_product_quantity_per_order,
            CAST(SUM(r.product_count) AS DOUBLE) / CAST(COUNT(DISTINCT r.id) AS DOUBLE) AS avg_products_per_receipt,
            CAST(SUM(r.total_items) AS DOUBLE) / CAST(COUNT(DISTINCT r.id) AS DOUBLE) AS avg_product_quantity_per_receipt,
            AVG(o.`total-cost`) AS avg_price
        FROM transform_orders o
        LEFT JOIN transform_receipts r ON o.id = r.`order-id`
        WHERE o.deleted = FALSE
        AND r.deleted = FALSE
        AND o.`created-date` IS NOT NULL
        GROUP BY DATE_FORMAT(o.`created-date`, 'yyyy-MM')
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()