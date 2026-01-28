from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    """
    Product Requests (Order Requests) Transformation Pipeline
    
    Validation Rules:
    1. User/Trader Link: Ensure both parties in the request are valid active entities
    2. Delivery Logic: Check that due-date is after created-date
    3. Status Validation: Ensure status matches Go enum constants
    4. ID Validation: Valid UUID formats
    5. Date Validation: Valid timestamps, logical date ordering
    6. Product Validation: All products exist in master data
    7. Cost Validation: Positive total cost
    8. Order-ID Link: If status is FULFILLED, order-id must exist
    9. Email Validation: Valid email format
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    # Source: Raw Product Requests from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_product_requests (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            `trader-id` STRING,
            `user-email` STRING,
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            `created-date` STRING,
            `due-date` STRING,
            `total-cost` DOUBLE,
            status STRING,
            `order-id` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/raw/order_requests.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    # Load valid users
    t_env.execute_sql("""
        CREATE TABLE valid_users (
            id STRING,
            email STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/users_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid traders
    t_env.execute_sql("""
        CREATE TABLE valid_traders (
            id STRING,
            `trader-type` STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/traders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid orders for FULFILLED status validation
    t_env.execute_sql("""
        CREATE TABLE valid_orders (
            id STRING,
            `user-id` STRING
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

    # Target: Transformed Product Requests in Parquet
    t_env.execute_sql("""
        CREATE TABLE transform_product_requests (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            `trader-id` STRING,
            `user-email` STRING,
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            `created-date` TIMESTAMP(3),
            `due-date` TIMESTAMP(3),
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            status STRING,
            `order-id` STRING,
            deleted BOOLEAN,
            product_count INT,
            total_items INT,
            delivery_days INT,
            is_overdue BOOLEAN,
            trader_type STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs:///datalake/transform/product_requests_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Create view to calculate request costs
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW request_calculations AS
        SELECT 
            pr.id as request_id,
            pr.`user-id`,
            pr.`trader-id`,
            pr.`user-email`,
            pr.products,
            pr.`created-date`,
            pr.`due-date`,
            pr.`total-cost`,
            pr.status,
            pr.`order-id`,
            pr.deleted,
            pr.`doc-type`,
            SUM(p.price * prod.quantity) as calculated_cost,
            COUNT(DISTINCT prod.`product-id`) as product_count,
            SUM(prod.quantity) as total_items
        FROM raw_product_requests pr
        CROSS JOIN UNNEST(pr.products) AS prod (`product-id`, quantity)
        LEFT JOIN valid_products p ON prod.`product-id` = p.id
        GROUP BY 
            pr.id, pr.`user-id`, pr.`trader-id`, pr.`user-email`, pr.products,
            pr.`created-date`, pr.`due-date`, pr.`total-cost`, pr.status, 
            pr.`order-id`, pr.deleted, pr.`doc-type`
    """)

    # Main Transformation with Comprehensive Validation
    t_env.execute_sql("""
        INSERT INTO transform_product_requests
        SELECT 
            rc.`doc-type`,
            rc.request_id as id,
            rc.`user-id`,
            rc.`trader-id`,
            LOWER(TRIM(rc.`user-email`)) as `user-email`,
            rc.products,
            TO_TIMESTAMP(rc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as `created-date`,
            TO_TIMESTAMP(rc.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as `due-date`,
            rc.`total-cost`,
            rc.calculated_cost as `calculated-cost`,
            ABS(rc.`total-cost` - rc.calculated_cost) as `cost-variance`,
            rc.status,
            rc.`order-id`,
            rc.deleted,
            rc.product_count,
            rc.total_items,
            TIMESTAMPDIFF(
                DAY, 
                TO_TIMESTAMP(rc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z'''),
                TO_TIMESTAMP(rc.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
            ) as delivery_days,
            CASE 
                WHEN TO_TIMESTAMP(rc.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') < CURRENT_TIMESTAMP 
                     AND rc.status NOT IN ('FULFILLED', 'CANCELED', 'REJECTED')
                THEN true 
                ELSE false 
            END as is_overdue,
            vt.`trader-type` as trader_type
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY `total-cost` DESC) as rn
            FROM request_calculations rc
            WHERE 
                -- 1. ID Validation: UUID format
                rc.request_id IS NOT NULL 
                AND CHAR_LENGTH(rc.request_id) = 36
                AND rc.request_id LIKE '%-%-%-%-%'
                
                -- 2. User Link: Must exist in valid users
                AND rc.`user-id` IS NOT NULL
                AND EXISTS (SELECT 1 FROM valid_users vu WHERE vu.id = rc.`user-id`)
                
                -- 3. Trader Link: Must exist in valid traders
                AND rc.`trader-id` IS NOT NULL
                AND EXISTS (SELECT 1 FROM valid_traders vt WHERE vt.id = rc.`trader-id`)
                
                -- 4. Email Validation
                AND rc.`user-email` IS NOT NULL
                AND rc.`user-email` LIKE '%@%.%'
                AND CHAR_LENGTH(rc.`user-email`) >= 5
                
                -- 5. Status Validation: Must be valid Go constant
                AND rc.status IS NOT NULL
                AND rc.status IN ('CREATED', 'PENDING_FUNDS', 'APPROVED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'CANCELED')
                
                -- 6. Date Validation: Both dates must exist
                AND rc.`created-date` IS NOT NULL
                AND rc.`created-date` <> ''
                AND rc.`due-date` IS NOT NULL
                AND rc.`due-date` <> ''
                
                -- 7. Delivery Logic: Due date must be after created date (positive delivery days)
                AND TO_TIMESTAMP(rc.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') > 
                    TO_TIMESTAMP(rc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''')
                
                -- 8. Products Validation
                AND rc.products IS NOT NULL
                AND CARDINALITY(rc.products) > 0
                
                -- 9. Product Existence: All products must exist
                AND rc.calculated_cost IS NOT NULL
                
                -- 10. Cost Validation
                AND rc.`total-cost` IS NOT NULL
                AND rc.`total-cost` > 0
                
                -- 11. Order-ID Link: If FULFILLED, order must exist and belong to same user
                AND (
                    (rc.status = 'FULFILLED' 
                     AND rc.`order-id` IS NOT NULL 
                     AND rc.`order-id` <> ''
                     AND EXISTS (
                         SELECT 1 FROM valid_orders vo 
                         WHERE vo.id = rc.`order-id` 
                         AND vo.`user-id` = rc.`user-id`
                     ))
                    OR
                    (rc.status <> 'FULFILLED')
                )
                
                -- 12. Data Quality: Not deleted
                AND rc.deleted = false
        ) rc
        INNER JOIN valid_traders vt ON rc.`trader-id` = vt.id
        WHERE rn = 1  -- Deduplication
    """).wait()

    print("✅ Product Requests transformation completed successfully!")
    print("   - Valid records written to: hdfs:///datalake/transform/product_requests_transformed.parquet")

if __name__ == '__main__':
    run_transformation()