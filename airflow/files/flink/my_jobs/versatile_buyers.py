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
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
            `date` TIMESTAMP(3),
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            status STRING,
            deleted BOOLEAN,
            product_count BIGINT NOT NULL,
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
            name STRING,
            `trader-type` STRING,
            `receipts-ids` ARRAY<STRING>,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
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
        CREATE TABLE versatile_buyers (
            user_id STRING,
            user_name STRING,
            user_surname STRING,
            user_email STRING,
            trader_ids STRING,
            trader_types STRING,
            orders_placed INT,
            receipts_created INT,
            products_bought INT,
            total_cost DOUBLE
        ) WITH (
            'connector' = 'jdbc',
            'url' = 'jdbc:postgresql://citus_coordinator:5432/curated_zone',
            'table-name' = 'versatile_buyers',
            'username' = 'postgres',
            'password' = '0Hf9Vnnxe3Cay5ZE',
            'driver' = 'org.postgresql.Driver',
            'sink.buffer-flush.max-rows' = '100',
            'sink.buffer-flush.interval' = '1s',
            'sink.max-retries' = '3'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO versatile_buyers
        SELECT 
            `user-id`                                        AS user_id,
            `user-name`                                      AS user_name,
            `user-surname`                                   AS user_surname,
            `user-email`                                     AS user_email,
            LISTAGG(DISTINCT trader_id, ',')                 AS trader_ids,
            LISTAGG(DISTINCT trader_type, ',')               AS trader_types,
            CAST(COUNT(DISTINCT order_id) AS INT)            AS orders_placed,
            CAST(COUNT(receipt_id) AS INT)                   AS receipts_created,
            CAST(SUM(p_count) AS INT)                        AS products_bought,
            SUM(t_cost)                                      AS total_cost
        FROM (
            SELECT 
                tu.id AS `user-id`, tu.name AS `user-name`, tu.surname AS `user-surname`, tu.email AS `user-email`,
                tt.id AS trader_id, tt.`trader-type` AS trader_type,
                tr.`order-id` AS order_id, tr.id AS receipt_id, 
                tr.product_count AS p_count, tr.`total-cost` AS t_cost
            FROM transform_receipts tr
            JOIN transform_traders tt ON tr.`trader-id` = tt.id
            JOIN transform_users tu ON tr.`user-id` = tu.id
            WHERE tt.deleted = FALSE
            AND tr.deleted = FALSE
            AND tu.deleted = FALSE
            AND tr.`date` >= TIMESTAMP '2024-01-01 00:00:00'
            AND tr.status = 'COMPLETED'
        )
        GROUP BY `user-id`, `user-name`, `user-surname`, `user-email`
        HAVING COUNT(DISTINCT trader_type) >= 3
    """).wait()

    print("✓ Data transformation complete: results written to Citus.")

if __name__ == '__main__':
    run_transformation()