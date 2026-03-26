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
        CREATE TABLE expiring_products_sales (
            total_cost DOUBLE,
            days_until_expiration INT,
            trader_type STRING,
            product_name STRING,
            quantity_sold INT,
            sales_percentage DOUBLE,
            `week` INT
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'expiring_products_sales',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO expiring_products_sales
        SELECT
            SUM(trp.quantity * tp.price)                          AS total_cost,
            tp.days_until_expiry                                  AS days_until_expiration,
            tp.`trader-type`                                      AS trader_type,
            tp.name                                               AS product_name,
            SUM(trp.quantity)                                     AS quantity_sold,
            ROUND(
                SUM(trp.quantity * tp.price) * 100.0
                / SUM(SUM(trp.quantity * tp.price)) OVER (
                    PARTITION BY tp.`trader-type`,
                                CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT)
                ),
                2
            )                                                     AS sales_percentage,
            CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT)      AS `week`
        FROM transform_receipts tr
        JOIN transform_receipt_products trp ON trp.receipt_id = tr.id
        JOIN transform_products tp          ON trp.product_id = tp.id
        WHERE tr.deleted  = FALSE
        AND tp.deleted  = FALSE
        AND tp.has_expiry = TRUE
        AND tp.days_until_expiry BETWEEN 0 AND 30
        GROUP BY
            tp.days_until_expiry,
            tp.`trader-type`,
            tp.name,
            CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT)
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()