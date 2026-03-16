from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    """
    Products Transformation Pipeline
    
    Validation Rules:
    1. Referential Integrity: trader-type exists in Traders dataset
    2. Price Sanity: price > 0
    3. Expiry Date Parsing: Convert to standard SQL Timestamps, filter invalid dates
    4. Quantity Validation: Non-negative quantity
    5. ID Validation: Valid UUID format
    6. Data Quality: Handle deleted records appropriately
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "flink-jobmanager-1")
    t_env.get_config().set("rest.port", "8081")

    # Source: Raw Products from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_products (
            `doc-type` STRING,
            id STRING,
            name STRING,
            `expiry-date` STRING,
            price DOUBLE,
            quantity INT,
            `trader-type` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/products.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            `trader-type` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Target: Transformed Products in Parquet
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

    # Main Transformation with Comprehensive Validation
    t_env.execute_sql("""
        INSERT INTO transform_products
        SELECT 
            p.`doc-type`,
            p.id,
            TRIM(p.name) as name,
            COALESCE(
                TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS TIMESTAMP(3)),
                TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss''Z''') AS TIMESTAMP(3))
            ) as `expiry-date`,
            p.price,
            p.quantity,
            p.`trader-type`,
            p.deleted,
            CASE 
                WHEN COALESCE(
                    TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS TIMESTAMP(3)),
                    TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss''Z''') AS TIMESTAMP(3))
                ) IS NOT NULL THEN true 
                ELSE false 
            END as has_expiry,
            CAST(TIMESTAMPDIFF(DAY,
                CURRENT_DATE,
                CAST(COALESCE(
                    TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') AS TIMESTAMP(3)),
                    TRY_CAST(TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss''Z''') AS TIMESTAMP(3))
                ) AS DATE)
            ) AS INT) as days_until_expiry
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (PARTITION BY id ORDER BY price DESC) as rn
            FROM raw_products p
            WHERE 
                p.id IS NOT NULL 
                AND CHAR_LENGTH(p.id) = 36
                AND p.id LIKE '%-%-%-%-%'
                AND p.price > 0
                AND p.price IS NOT NULL
                AND p.quantity >= 0
                AND p.quantity IS NOT NULL
                AND p.`trader-type` IS NOT NULL
                AND p.`trader-type` IN ('SUPERMARKET', 'PHARMACY', 'GROCERY', 'CARDEALER')
                AND EXISTS (
                    SELECT 1 FROM valid_traders vt 
                    WHERE vt.`trader-type` = p.`trader-type`
                )
                AND p.name IS NOT NULL
                AND TRIM(p.name) <> ''
                AND (
                    (p.`expiry-date` IS NOT NULL AND p.`expiry-date` <> '' AND p.deleted = false)
                    OR (p.`expiry-date` IS NULL OR p.`expiry-date` = '')
                )
        ) p
        WHERE rn = 1
    """).wait()

    print("Products transformation completed successfully!")
    print("   - Valid records written to: hdfs://namenode:9000/datalake/transform/products_transformed.parquet")

if __name__ == '__main__':
    run_transformation()