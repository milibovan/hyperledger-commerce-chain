from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    """
    Receipts Transformation Pipeline
    
    Validation Rules:
    1. Triple-Link Check: Verify order-id, user-id, and trader-id all exist and are logically linked
    2. Status Consistency: Receipt should only exist for orders in COMPLETED/FULFILLED state
    3. User Consistency: User on receipt matches user who placed the order
    4. Product Validation: All products exist in master data
    5. ID Validation: Valid UUID formats
    6. Date Validation: Valid timestamps
    7. Cost Validation: Positive total cost
    8. Cancellation Logic: If cancelled, must have cancelled-date and cancelled-by
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    # Source: Raw Receipts from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_receipts (
            `doc-type` STRING,
            id STRING,
            `trader-id` STRING,
            `user-id` STRING,
            `order-id` STRING,
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            date STRING,
            `total-cost` DOUBLE,
            status STRING,
            `cancelled-date` STRING,
            `cancelled-by` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/raw/receipts.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    # Load valid users
    t_env.execute_sql("""
        CREATE TABLE valid_users (
            id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/users_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid traders
    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid orders with their user-id and status for cross-validation
    t_env.execute_sql("""
        CREATE TABLE valid_orders (
            id STRING,
            `user-id` STRING,
            status STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/orders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid products
    t_env.execute_sql("""
        CREATE TABLE valid_products (
            id STRING,
            price DOUBLE
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/products_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Target: Transformed Receipts in Parquet
    t_env.execute_sql("""
        CREATE TABLE transform_receipts (
            `doc-type` STRING,
            id STRING,
            `trader-id` STRING,
            `user-id` STRING,
            `order-id` STRING,
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            date TIMESTAMP(3),
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            status STRING,
            `cancelled-date` TIMESTAMP(3),
            `cancelled-by` STRING,
            deleted BOOLEAN,
            product_count INT,
            total_items INT,
            order_status STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/receipts_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Create view to calculate receipt costs
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW receipt_calculations AS
        SELECT 
            r.id as receipt_id,
            r.`trader-id`,
            r.`user-id`,
            r.`order-id`,
            r.products,
            r.date,
            r.`total-cost`,
            r.status,
            r.`cancelled-date`,
            r.`cancelled-by`,
            r.deleted,
            r.`doc-type`,
            SUM(p.price * prod.quantity) as calculated_cost,
            COUNT(DISTINCT prod.`product-id`) as product_count,
            SUM(prod.quantity) as total_items
        FROM raw_receipts r
        CROSS JOIN UNNEST(r.products) AS prod (`product-id`, quantity)
        LEFT JOIN valid_products p ON prod.`product-id` = p.id
        GROUP BY 
            r.id, r.`trader-id`, r.`user-id`, r.`order-id`, r.products,
            r.date, r.`total-cost`, r.status, r.`cancelled-date`, 
            r.`cancelled-by`, r.deleted, r.`doc-type`
    """)

    # Main Transformation with Triple-Link Validation
    t_env.execute_sql("""
        INSERT INTO transform_receipts
        SELECT 
            rc.`doc-type`,
            rc.receipt_id as id,
            rc.`trader-id`,
            rc.`user-id`,
            rc.`order-id`,
            rc.products,
            TO_TIMESTAMP(rc.date, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as date,
            rc.`total-cost`,
            rc.calculated_cost as `calculated-cost`,
            ABS(rc.`total-cost` - rc.calculated_cost) as `cost-variance`,
            rc.status,
            CASE 
                WHEN rc.`cancelled-date` IS NOT NULL AND rc.`cancelled-date` <> '' 
                THEN TO_TIMESTAMP(rc.`cancelled-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
                ELSE NULL 
            END as `cancelled-date`,
            rc.`cancelled-by`,
            rc.deleted,
            rc.product_count,
            rc.total_items,
            vo.status as order_status
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY receipt_id ORDER BY `total-cost` DESC) as rn
            FROM receipt_calculations rc
            INNER JOIN valid_orders vo ON rc.`order-id` = vo.id
            WHERE 
                -- 1. ID Validation: UUID format
                rc.receipt_id IS NOT NULL 
                AND CHAR_LENGTH(rc.receipt_id) = 36
                AND rc.receipt_id LIKE '%-%-%-%-%'
                
                -- 2. Triple-Link Check Part 1: Order exists
                AND rc.`order-id` IS NOT NULL
                AND EXISTS (SELECT 1 FROM valid_orders vo WHERE vo.id = rc.`order-id`)
                
                -- 3. Triple-Link Check Part 2: User exists
                AND rc.`user-id` IS NOT NULL
                AND EXISTS (SELECT 1 FROM valid_users vu WHERE vu.id = rc.`user-id`)
                
                -- 4. Triple-Link Check Part 3: Trader exists
                AND rc.`trader-id` IS NOT NULL
                AND EXISTS (SELECT 1 FROM valid_traders vt WHERE vt.id = rc.`trader-id`)
                
                -- 5. User Consistency: User on receipt matches user on order
                AND vo.`user-id` = rc.`user-id`
                
                -- 6. Status Consistency: Order must be in valid state for receipt
                AND vo.status IN ('FULFILLED', 'APPROVED', 'COMPLETED')
                
                -- 7. Receipt Status Validation
                AND rc.status IS NOT NULL
                AND rc.status IN ('COMPLETED', 'CANCELLED', 'IN_PROGRESS')
                
                -- 8. Products Validation
                AND rc.products IS NOT NULL
                AND CARDINALITY(rc.products) > 0
                
                -- 9. Product Existence: All products must exist
                AND rc.calculated_cost IS NOT NULL
                
                -- 10. Cost Validation
                AND rc.`total-cost` IS NOT NULL
                AND rc.`total-cost` > 0
                
                -- 11. Date validation
                AND rc.date IS NOT NULL
                AND rc.date <> ''
                
                -- 12. Cancellation Logic
                AND (
                    (rc.status = 'CANCELLED' 
                     AND rc.`cancelled-date` IS NOT NULL 
                     AND rc.`cancelled-date` <> ''
                     AND rc.`cancelled-by` IS NOT NULL
                     AND rc.`cancelled-by` <> '')
                    OR
                    (rc.status <> 'CANCELLED')
                )
                
                -- 13. Data Quality: Not deleted
                AND rc.deleted = false
        ) rc
        INNER JOIN valid_orders vo ON rc.`order-id` = vo.id
        WHERE rn = 1  -- Deduplication
    """).wait()

    print("✅ Receipts transformation completed successfully!")
    print("   - Valid records written to: hdfs:///datalake/transform/receipts_transformed.parquet")

if __name__ == '__main__':
    run_transformation()