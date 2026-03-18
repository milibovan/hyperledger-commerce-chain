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
        CREATE TABLE transform_users (
            `doc-type` STRING,
            id STRING,
            name STRING,
            surname STRING,
            email STRING,
            balance DOUBLE,
            `orders-ids` ARRAY<STRING>,
            deleted BOOLEAN,
            order_count INT,
            request_count INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/users_transformed.parquet',
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
        CREATE TABLE unsuccessful_requests_value (
            status STRING,
            trader_type STRING,
            user_tier STRING,
            avg_value DOUBLE,
            request_count BIGINT,
            avg_product_count BIGINT,
            avg_validity_days INT,
            PRIMARY KEY (status, trader_type, user_tier) NOT ENFORCED
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'unsuccessful_requests_value',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3',
            'sink.parallelism' = '1'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO unsuccessful_requests_value
        SELECT
            tpr.status,
            tt.`trader-type`                                    AS trader_type,
            CASE
                WHEN tu.balance < 10000 THEN 'low'
                WHEN tu.balance < 35000 THEN 'mid'
                ELSE 'high'
            END                                                 AS user_tier,
            AVG(tpr.`total-cost`)                               AS avg_value,
            COUNT(*)                                            AS request_count,
            AVG(tpr.product_count)                              AS avg_product_count,
            AVG(TIMESTAMPDIFF(DAY, tpr.`created-date`, tpr.`due-date`)) AS avg_validity_days
        FROM transform_product_requests tpr
        JOIN transform_users tu ON tpr.`user-id` = tu.id
        JOIN transform_traders tt ON tt.id = tpr.`trader-id`
        WHERE tpr.deleted = FALSE
        AND tu.deleted = FALSE
        AND tt.deleted = FALSE
        AND tpr.status IN ('REJECTED', 'CANCELED', 'EXPIRED')
        GROUP BY
            tpr.status,
            tt.`trader-type`,
            CASE
                WHEN tu.balance < 10000 THEN 'low'
                WHEN tu.balance < 35000 THEN 'mid'
                ELSE 'high'
            END
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()