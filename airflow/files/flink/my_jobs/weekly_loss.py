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
            `products-available` ARRAY<ROW<`product-id` STRING, quantity INT>>,
            `receipts-ids` ARRAY<STRING>,
            `requests-ids` ARRAY<STRING>,
            balance DOUBLE,
            deleted BOOLEAN,
            product_count INT,
            receipt_count INT,
            request_count INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE weekly_loss (
            `week` INT,
            cumulative_loss DOUBLE,
            trader_id STRING,
            `year` INT
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'weekly_loss',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO weekly_loss
        WITH WeeklyTotals AS (
            SELECT 
                tt.id as trader_id,
                CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT) as week_num,
                CAST(DATE_FORMAT(tp.`expiry-date`, 'yyyy') AS INT) as year_val,
                SUM(tp.price * tp.quantity) as weekly_sum
            FROM transform_traders tt
            CROSS JOIN UNNEST(tt.`products-available`) AS t(t_product_id, qty)
            JOIN transform_products tp ON t.t_product_id = tp.id
            WHERE tt.deleted = FALSE 
            AND tp.deleted = FALSE
            AND tp.`expiry-date` IS NOT NULL
            GROUP BY tt.id, CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT), DATE_FORMAT(tp.`expiry-date`, 'yyyy')
        )
        SELECT 
            week_num as `week`,
            SUM(weekly_sum) OVER (
                PARTITION BY trader_id, year_val 
                ORDER BY week_num 
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) as cumulative_loss,
            trader_id,
            year_val as `year`
        FROM WeeklyTotals
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()