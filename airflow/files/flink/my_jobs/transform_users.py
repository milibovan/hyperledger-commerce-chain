from pyflink.table import EnvironmentSettings, TableEnvironment
from pyflink.table.expressions import col, lit
import re

def run_transformation():
    """
    Users Transformation Pipeline
    
    Validation Rules:
    1. Format Normalization: Ensure id is valid UUID
    2. Email Validation: Filter invalid emails
    3. Balance Integrity: Check balance >= 0
    4. Deduplication: Ensure no duplicate IDs
    5. Non-null required fields: id, name, surname, email
    6. Data Quality: Filter deleted records
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "jobmanager")
    t_env.get_config().set("rest.port", "8081")

    # Source: Raw Users from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_users (
            `doc-type` STRING,
            id STRING,
            name STRING,
            surname STRING,
            email STRING,
            balance DOUBLE,
            `orders-ids` ARRAY<STRING>,
            `requests-ids` ARRAY<STRING>,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/users.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
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
            `requests-ids` ARRAY<STRING>,
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
        INSERT INTO transform_users
        SELECT 
            `doc-type`,
            id,
            TRIM(name) as name,
            TRIM(surname) as surname,
            LOWER(TRIM(email)) as email,
            balance,
            `orders-ids`,
            `requests-ids`,
            deleted,
            CARDINALITY(`orders-ids`) as order_count,
            CARDINALITY(`requests-ids`) as request_count
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY id ORDER BY balance DESC) as rn
            FROM raw_users
            WHERE 
                -- 1. ID Validation: UUID format (8-4-4-4-12 pattern)
                id IS NOT NULL 
                AND CHAR_LENGTH(id) = 36
                AND id LIKE '%-%-%-%-%'
                
                -- 2. Email Validation: Must contain @ and .
                AND email IS NOT NULL
                AND email LIKE '%@%.%'
                AND CHAR_LENGTH(email) >= 5
                AND email NOT LIKE '%..%'
                AND email NOT LIKE '@%'
                AND email NOT LIKE '%.@%'
                
                -- 3. Balance Integrity: Non-negative
                AND balance >= 0
                AND balance IS NOT NULL
                
                -- 4. Required fields not null
                AND name IS NOT NULL
                AND surname IS NOT NULL
                AND TRIM(name) <> ''
                AND TRIM(surname) <> ''
                
                -- 5. Data Quality: Not deleted
                AND deleted = false
        )
        WHERE rn = 1  -- 6. Deduplication: Keep only first occurrence per ID
    """).wait()

    print("Users transformation completed successfully!")
    print("   - Valid records written to: hdfs://namenode:9000/datalake/transform/users_transformed.parquet")

if __name__ == '__main__':
    run_transformation()