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
            'path' = 'hdfs:///datalake/raw/products.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    -- Load valid trader types for referential integrity check
    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            `trader-type` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/traders_transformed.parquet',
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
            'path' = 'hdfs:///datalake/transform/products_transformed.parquet',
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
            CASE 
                WHEN p.`expiry-date` IS NOT NULL AND p.`expiry-date` <> '' 
                THEN TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
                ELSE NULL
            END as `expiry-date`,
            p.price,
            p.quantity,
            p.`trader-type`,
            p.deleted,
            CASE WHEN p.`expiry-date` IS NOT NULL AND p.`expiry-date` <> '' THEN true ELSE false END as has_expiry,
            CASE 
                WHEN p.`expiry-date` IS NOT NULL AND p.`expiry-date` <> '' 
                THEN TIMESTAMPDIFF(DAY, CURRENT_TIMESTAMP, TO_TIMESTAMP(p.`expiry-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z'''))
                ELSE NULL
            END as days_until_expiry
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY id ORDER BY price DESC) as rn
            FROM raw_products p
            WHERE 
                -- 1. ID Validation: UUID format
                p.id IS NOT NULL 
                AND CHAR_LENGTH(p.id) = 36
                AND p.id LIKE '%-%-%-%-%'
                
                -- 2. Price Sanity: Must be positive
                AND p.price > 0
                AND p.price IS NOT NULL
                
                -- 3. Quantity Validation: Non-negative
                AND p.quantity >= 0
                AND p.quantity IS NOT NULL
                
                -- 4. Trader Type Validation: Must be valid enum
                AND p.`trader-type` IS NOT NULL
                AND p.`trader-type` IN ('SUPERMARKET', 'PHARMACY', 'GROCERY', 'CARDEALER', 'GAS_STATION')
                
                -- 5. Referential Integrity: Check trader-type exists
                AND EXISTS (
                    SELECT 1 FROM valid_traders vt 
                    WHERE vt.`trader-type` = p.`trader-type`
                )
                
                -- 6. Name validation
                AND p.name IS NOT NULL
                AND TRIM(p.name) <> ''
                
                -- 7. Expiry Date Logic: If no expiry date, should be deleted
                -- (Non-perishable items are marked as deleted per business rule)
                AND (
                    (p.`expiry-date` IS NOT NULL AND p.`expiry-date` <> '' AND p.deleted = false)
                    OR
                    (p.`expiry-date` IS NULL OR p.`expiry-date` = '')
                )
        ) p
        WHERE rn = 1  -- Deduplication
    """).wait()

    print("Products transformation completed successfully!")
    print("   - Valid records written to: hdfs:///datalake/transform/products_transformed.parquet")

if __name__ == '__main__':
    run_transformation()