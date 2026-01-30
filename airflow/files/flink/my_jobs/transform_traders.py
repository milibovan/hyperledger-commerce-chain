from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    """
    Traders Transformation Pipeline
    
    Validation Rules:
    1. Type Validation: trader-type matches Go enum (SUPERMARKET, PHARMACY, GROCERY, CARDEALER)
    2. VAT Check: Validate VAT structure (VAT-XXXXXXXX format)
    3. ID Uniqueness: Ensure unique primary key
    4. Email Validation: Valid email format
    5. Balance Integrity: Non-negative balance
    6. Data Quality: Filter deleted records
    7. Required fields validation
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "flink-jobmanager-1")
    t_env.get_config().set("rest.port", "8081")

    # Source: Raw Traders from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_traders (
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
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/traders.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    # Target: Transformed Traders in Parquet
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

    # Main Transformation with Validation
    t_env.execute_sql("""
        INSERT INTO transform_traders
        SELECT 
            `doc-type`,
            id,
            TRIM(name) as name,
            LOWER(TRIM(email)) as email,
            `trader-type`,
            UPPER(TRIM(vat)) as vat,
            `products-available`,
            `receipts-ids`,
            `requests-ids`,
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
                -- 1. ID Validation: UUID format
                id IS NOT NULL 
                AND CHAR_LENGTH(id) = 36
                AND id LIKE '%-%-%-%-%'
                
                -- 2. Trader Type Validation: Must be valid enum
                AND `trader-type` IS NOT NULL
                AND `trader-type` IN ('SUPERMARKET', 'PHARMACY', 'GROCERY', 'CARDEALER', 'GAS_STATION')
                
                -- 3. VAT Validation: Must follow VAT-XXXXXXXX pattern
                AND vat IS NOT NULL
                AND vat LIKE 'VAT-%'
                AND CHAR_LENGTH(vat) >= 8
                
                -- 4. Email Validation
                AND email IS NOT NULL
                AND email LIKE '%@%.%'
                AND CHAR_LENGTH(email) >= 5
                AND email NOT LIKE '%..%'
                AND email NOT LIKE '@%'
                AND email NOT LIKE '%.@%'
                
                -- 5. Balance Integrity
                AND balance >= 0
                AND balance IS NOT NULL
                
                -- 6. Required fields not null
                AND name IS NOT NULL
                AND TRIM(name) <> ''
                
                -- 7. Data Quality: Not deleted
                AND deleted = false
        )
        WHERE rn = 1  -- Deduplication
    """).wait()

    print("✅ Traders transformation completed successfully!")
    print("   - Valid records written to: hdfs://namenode:9000/datalake/transform/traders_transformed.parquet")

if __name__ == '__main__':
    run_transformation()