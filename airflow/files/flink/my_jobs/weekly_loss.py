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
        CREATE TABLE transform_products (
            id STRING,
            `trader-type` STRING,
            price DOUBLE,
            quantity INT,
            `expiry-date` TIMESTAMP(3),
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/products_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_traders (
            id STRING,
            `trader-type` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

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
                tt.id AS trader_id,
                CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT) AS week_num,
                CAST(DATE_FORMAT(tp.`expiry-date`, 'yyyy') AS INT) AS year_val,
                SUM(tp.price * tp.quantity) AS weekly_sum
            FROM transform_traders tt
            JOIN transform_trader_products ttp
                ON tt.id = ttp.trader_id
            JOIN transform_products tp
                ON tp.id = ttp.product_id
            WHERE tt.deleted = FALSE
              AND tp.deleted = FALSE
              AND tp.`expiry-date` IS NOT NULL
              AND tp.`expiry-date` <= CURRENT_TIMESTAMP
            GROUP BY
                tt.id,
                CAST(EXTRACT(WEEK FROM tp.`expiry-date`) AS INT),
                DATE_FORMAT(tp.`expiry-date`, 'yyyy')
        )
        SELECT
            week_num AS `week`,
            SUM(weekly_sum) OVER (
                PARTITION BY trader_id, year_val
                ORDER BY week_num
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS cumulative_loss,
            trader_id,
            year_val AS `year`
        FROM WeeklyTotals
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()