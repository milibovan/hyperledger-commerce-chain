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
        CREATE TABLE transform_trader_products (
            trader_id STRING,
            product_id STRING,
            quantity INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/trader_products.parquet',
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
        CREATE TABLE transform_traders (
            `doc-type` STRING,
            id STRING,
            name STRING,
            email STRING,
            `trader-type` STRING,
            vat STRING,
            balance DOUBLE,
            deleted BOOLEAN,
            product_count BIGINT,
            receipt_count BIGINT,
            request_count BIGINT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)
    
    t_env.execute_sql("""
        CREATE TABLE inventory_value (
            trader_name STRING,
            trader_type STRING,
            total_product_quantity INT,
            total_inventory_value DOUBLE,
            `week` INT
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'inventory_value',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO inventory_value
        SELECT 
            tt.name                                      AS trader_name,
            tt.`trader-type`                             AS trader_type,
            SUM(ttp.quantity)                            AS total_product_quantity,
            SUM(tp.price * ttp.quantity)                 AS total_inventory_value,
            CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT) AS week
        FROM transform_traders tt
        JOIN transform_trader_products ttp ON ttp.trader_id = tt.id
        JOIN transform_products tp ON ttp.product_id = tp.id
        WHERE tt.deleted = FALSE
        AND tp.deleted = FALSE
        AND tp.`expiry-date` > CURRENT_TIMESTAMP
        GROUP BY 
            tt.name, tt.`trader-type`,
            CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT);
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()