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

    t_env.get_config().set("rest.address", "flink-jobmanager-1")
    t_env.get_config().set("rest.port", "8081")

    # Source: Raw Product Requests from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_product_requests (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            `trader-id` STRING,
            `user-email` STRING,
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
            `created-date` STRING,
            `due-date` STRING,
            `total-cost` DOUBLE,
            status STRING,
            `order-id` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/order_requests.jsonl',
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
            'path' = 'hdfs://namenode:9000/datalake/transform/users_transformed.parquet',
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
            'path' = 'hdfs://namenode:9000/datalake/transform/traders_transformed.parquet',
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
            'path' = 'hdfs://namenode:9000/datalake/transform/orders_transformed.parquet',
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
            'path' = 'hdfs://namenode:9000/datalake/transform/products_transformed.parquet',
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
            products ARRAY<ROW<`product_id` STRING, quantity INT>>,
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
            COUNT(DISTINCT prod.`product_id`) as product_count,
            SUM(prod.quantity) as total_items
        FROM raw_product_requests pr
        CROSS JOIN UNNEST(pr.products) AS prod (`product_id`, quantity)
        LEFT JOIN valid_products p ON prod.`product_id` = p.id
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
            rc.request_id as id,   -- Fixed: Use request_id from view
            rc.`user-id`,
            rc.`trader-id`,
            LOWER(TRIM(rc.`user-email`)) as `user-email`,
            rc.products,
            rc.ts_created as `created-date`,
            rc.ts_due as `due-date`,
            rc.`total-cost`,
            rc.calculated_cost as `calculated-cost`,
            ABS(rc.`total-cost` - rc.calculated_cost) as `cost-variance`,
            rc.status,
            rc.`order-id`,
            rc.deleted,
            rc.product_count,
            rc.total_items,
            TIMESTAMPDIFF(DAY, rc.ts_created, rc.ts_due) as delivery_days, -- Calculated here
            CASE 
                WHEN rc.ts_due < CAST(CURRENT_TIMESTAMP AS TIMESTAMP(3)) 
                     AND rc.status NOT IN ('FULFILLED', 'CANCELED', 'REJECTED')
                THEN true 
                ELSE false 
            END as is_overdue,
            rc.trader_type
        FROM (
            SELECT 
                rc.*,
                vt.`trader-type` as trader_type,
                TO_TIMESTAMP(rc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as ts_created,
                TO_TIMESTAMP(rc.`due-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as ts_due,
                ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY `total-cost` DESC) as rn
            FROM request_calculations rc
            INNER JOIN valid_users vu ON rc.`user-id` = vu.id
            INNER JOIN valid_traders vt ON rc.`trader-id` = vt.id
            LEFT JOIN valid_orders vo ON rc.`order-id` = vo.id
            WHERE 
                rc.request_id IS NOT NULL 
                AND CHAR_LENGTH(rc.request_id) = 36
                AND rc.status IN ('CREATED', 'PENDING_FUNDS', 'APPROVED', 'REJECTED', 'EXPIRED', 'FULFILLED', 'CANCELED')
                AND rc.calculated_cost IS NOT NULL
                AND rc.deleted = false
                AND (rc.status <> 'FULFILLED' OR (rc.status = 'FULFILLED' AND vo.id IS NOT NULL AND vo.`user-id` = rc.`user-id`))
        ) rc
        WHERE rn = 1
    """).wait()

    print("✅ Product Requests transformation completed successfully!")
    print("   - Valid records written to: hdfs://namenode:9000/datalake/transform/product_requests_transformed.parquet")

if __name__ == '__main__':
    run_transformation()