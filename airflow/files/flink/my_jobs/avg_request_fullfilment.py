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
        CREATE TABLE transform_orders (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            status STRING,
            `created-date` TIMESTAMP(3),
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
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
        CREATE TABLE transform_receipts (
            `doc-type` STRING,
            id STRING,
            `trader-id` STRING,
            `user-id` STRING,
            `order-id` STRING,
            products STRING,
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

    # 3. Target: Citus (PostgreSQL)
    t_env.execute_sql("""
        CREATE TABLE avg_request_fullfilment (
            avg_days DOUBLE,
            trader_type STRING,
            avg_total_cost DOUBLE
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'avg_request_fullfilment',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO avg_request_fullfilment
        SELECT 
            AVG(TIMESTAMPDIFF(DAY, tpr.`created-date`, first_receipt.min_date)) AS avg_days,
            tt.`trader-type` AS trader_type,
            AVG(tpr.`total-cost`) AS avg_total_cost
        FROM transform_product_requests tpr
        JOIN transform_orders o
            ON tpr.`order-id` = o.id
        JOIN (
            SELECT `order-id`, MIN(`date`) AS min_date   -- collapse receipts to one row per order
            FROM transform_receipts
            WHERE deleted = FALSE AND status = 'COMPLETED'
            GROUP BY `order-id`
        ) first_receipt
            ON first_receipt.`order-id` = o.id
        JOIN transform_traders tt
            ON tt.id = tpr.`trader-id`
        WHERE tpr.deleted = FALSE
            AND o.deleted = FALSE
            AND tt.deleted = FALSE
            AND tpr.status = 'FULFILLED'
            AND o.status = 'FULFILLED'
        GROUP BY tt.`trader-type`
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()