from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    # 1. Setup Environment
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    # 2. Define Source (Raw HDFS)
    t_env.execute_sql("""
        CREATE TABLE raw_orders (
            id STRING,
            user_id STRING,
            total_cost DOUBLE,
            `created-date` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/raw/orders.jsonl',
            'format' = 'json'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE raw_users (
            id STRING,
            name STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/raw/users.jsonl',
            'format' = 'json'
        )
    """)

    # 3. Define Sink (Transform HDFS - Parquet)
    t_env.execute_sql("""
        CREATE TABLE transform_orders (
            id STRING,
            user_id STRING,
            total_cost DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/orders_cleaned.parquet',
            'format' = 'parquet'
        )
    """)

    # 4. The "Matching Pair" Logic (Join & Filter)
    t_env.execute_sql("""
        INSERT INTO transform_orders
        SELECT o.id, o.user_id, o.total_cost
        FROM raw_orders o
        JOIN raw_users u ON o.user_id = u.id
        WHERE o.total_cost > 0
    """).wait()

if __name__ == '__main__':
    run_transformation()