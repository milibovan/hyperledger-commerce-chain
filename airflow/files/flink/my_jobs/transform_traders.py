from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "jobmanager")
    t_env.get_config().set("rest.port", "8081")

    t_env.execute_sql("""
        CREATE TABLE raw_traders (
            `doc-type` STRING,
            id STRING,
            name STRING,
            email STRING,
            `trader-type` STRING,
            vat STRING,
            `products-available` ARRAY<ROW<product_id STRING, quantity INT>>,
            `receipts-ids` ARRAY<STRING>,
            `requests-ids` ARRAY<STRING>,
            balance DOUBLE,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/traders.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
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
        CREATE TABLE transform_trader_receipts (
            trader_id STRING,
            receipt_id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/trader_receipts.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE transform_trader_requests (
            trader_id STRING,
            request_id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/trader_requests.parquet',
            'format' = 'parquet'
        )
    """)

    t_env.execute_sql("""
        INSERT INTO transform_traders
        SELECT 
            `doc-type`,
            id,
            TRIM(name) as name,
            LOWER(TRIM(email)) as email,
            `trader-type`,
            UPPER(TRIM(vat)) as vat,
            balance,
            deleted,
            CARDINALITY(`products-available`) as product_count,
            CARDINALITY(`receipts-ids`) as receipt_count,
            CARDINALITY(`requests-ids`) as request_count
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY id ORDER BY balance DESC) as rn
            FROM raw_traders
            WHERE 
                id IS NOT NULL AND CHAR_LENGTH(id) = 36 AND id LIKE '%-%-%-%-%'
                AND `trader-type` IN ('SUPERMARKET','PHARMACY','GROCERY','CARDEALER','GAS_STATION')
                AND vat IS NOT NULL AND vat LIKE 'VAT-%' AND CHAR_LENGTH(vat) >= 8
                AND email IS NOT NULL AND email LIKE '%@%.%' AND CHAR_LENGTH(email) >= 5
                AND email NOT LIKE '%..%' AND email NOT LIKE '@%' AND email NOT LIKE '%.@%'
                AND balance >= 0 AND balance IS NOT NULL
                AND name IS NOT NULL AND TRIM(name) <> ''
                AND deleted = false
        )
        WHERE rn = 1
    """).wait()

    t_env.execute_sql("""
        INSERT INTO transform_trader_products
        SELECT
            r.id AS trader_id,
            prod.product_id,
            prod.quantity
        FROM raw_traders r
        CROSS JOIN UNNEST(r.`products-available`) AS prod (product_id, quantity)
        WHERE r.deleted = false
    """).wait()

    t_env.execute_sql("""
        INSERT INTO transform_trader_receipts
        SELECT
            r.id AS trader_id,
            receipt_id
        FROM raw_traders r
        CROSS JOIN UNNEST(r.`receipts-ids`) AS receipt_id
        WHERE r.deleted = false
    """).wait()

    t_env.execute_sql("""
        INSERT INTO transform_trader_requests
        SELECT
            r.id AS trader_id,
            request_id
        FROM raw_traders r
        CROSS JOIN UNNEST(r.`requests-ids`) AS request_id
        WHERE r.deleted = false
    """).wait()

    print("✅ Traders normalization completed successfully!")

if __name__ == '__main__':
    run_transformation()
