from pyflink.table import EnvironmentSettings, TableEnvironment
import os

def run_transformation():
    # Use BATCH mode for aggregation if processing historical data
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    # Connector & JAR Configuration
    lib_dir = "/opt/flink/lib/"
    if os.path.exists(lib_dir):
        jars = [f"file://{os.path.join(lib_dir, jar)}" for jar in os.listdir(lib_dir) if jar.endswith(".jar")]
        jar_string = ";".join(jars)
        t_env.get_config().set("pipeline.jars", jar_string)
        t_env.get_config().set("pipeline.classpaths", jar_string)

    # 1. UPDATED SCHEMA: Matches product_requests_transformed.parquet (19 columns)
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

    # 2. UPDATED SCHEMA: Matches products_transformed.parquet (10 columns)
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

    # 3. Target: Citus (PostgreSQL)
    t_env.execute_sql("""
        CREATE TABLE avg_price_and_quantity (
            `month` STRING,
            `avg_price` DOUBLE,
            `avg_quantity` DOUBLE,
            `avg_validity_days` DOUBLE,
            PRIMARY KEY (`month`) NOT ENFORCED
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'avg_price_and_quantity',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO avg_price_and_quantity
        SELECT 
            DATE_FORMAT(pr.`created-date`, 'yyyy-MM') as `month`,
            AVG(p.price) as avg_price,
            AVG(CAST(pr.total_items AS DOUBLE) / CAST(pr.product_count AS DOUBLE)) as avg_quantity,
            AVG(CAST(pr.delivery_days AS DOUBLE)) as avg_validity_days
        FROM transform_product_requests pr
        JOIN transform_products p ON pr.`trader-id` = p.`trader-type`  -- Adjust join condition as needed
        WHERE pr.deleted = FALSE AND p.deleted = FALSE
        GROUP BY DATE_FORMAT(pr.`created-date`, 'yyyy-MM')
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()