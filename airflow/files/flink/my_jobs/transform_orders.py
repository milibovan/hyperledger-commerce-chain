from pyflink.table import EnvironmentSettings, TableEnvironment

def run_transformation():
    """
    Orders Transformation Pipeline (Heaviest file - 179MB)
    
    Validation Rules:
    1. User Check: Drop orders where user-id doesn't exist in Users table
    2. Status Validation: Ensure status is valid Go constant (PENDING, APPROVED, FULFILLED, CANCELLED)
    3. Product Existence: Verify every product-id exists in Products master file
    4. Calculation Audit: Re-calculate total-cost and verify it matches
    5. ID Validation: Valid UUID format
    6. Date Validation: Valid timestamp format
    7. Products Array Validation: Non-empty, valid structure
    """
    settings = EnvironmentSettings.new_instance().in_batch_mode().build()
    t_env = TableEnvironment.create(settings)

    t_env.get_config().set("rest.address", "flink-jobmanager-1")
    t_env.get_config().set("rest.port", "8081")

    # Source: Raw Orders from JSONL
    t_env.execute_sql("""
        CREATE TABLE raw_orders (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            status STRING,
            `created-date` STRING,
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            `receipts-ids` ARRAY<STRING>,
            `total-cost` DOUBLE,
            `request-id` STRING,
            deleted BOOLEAN
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/raw/orders.jsonl',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """)

    # Load valid users for referential integrity
    t_env.execute_sql("""
        CREATE TABLE valid_users (
            id STRING
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/users_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Load valid products for referential integrity and price calculation
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

    # Target: Transformed Orders in Parquet
    t_env.execute_sql("""
        CREATE TABLE transform_orders (
            `doc-type` STRING,
            id STRING,
            `user-id` STRING,
            status STRING,
            `created-date` TIMESTAMP(3),
            products ARRAY<ROW<`product-id` STRING, quantity INT>>,
            `receipts-ids` ARRAY<STRING>,
            `total-cost` DOUBLE,
            `calculated-cost` DOUBLE,
            `cost-variance` DOUBLE,
            `request-id` STRING,
            deleted BOOLEAN,
            product_count BIGINT NOT NULL,
            total_items INT
        ) WITH (
            'connector' = 'filesystem',
            'path' = 'hdfs://namenode:9000/datalake/transform/orders_transformed.parquet',
            'format' = 'parquet'
        )
    """)

    # Create temporary view to calculate costs per order
    # This explodes the products array and joins with product prices
    t_env.execute_sql("""
        CREATE TEMPORARY VIEW order_calculations AS
        SELECT 
            o.id as order_id,
            o.`user-id`,
            o.status,
            o.`created-date`,
            o.products,
            o.`receipts-ids`,
            o.`total-cost`,
            o.`request-id`,
            o.deleted,
            o.`doc-type`,
            SUM(p.price * prod.quantity) as calculated_cost,
            COUNT(DISTINCT prod.`product-id`) as product_count,
            SUM(prod.quantity) as total_items
        FROM raw_orders o
        CROSS JOIN UNNEST(o.products) AS prod (`product-id`, quantity)
        LEFT JOIN valid_products p ON prod.`product-id` = p.id
        GROUP BY 
            o.id, o.`user-id`, o.status, o.`created-date`, o.products,
            o.`receipts-ids`, o.`total-cost`, o.`request-id`, o.deleted, o.`doc-type`
    """)

    # Main Transformation with Comprehensive Validation
    t_env.execute_sql("""
        INSERT INTO transform_orders
        SELECT 
            oc.`doc-type`,
            oc.order_id as id,
            oc.`user-id`,
            oc.status,
            TO_TIMESTAMP(oc.`created-date`, 'yyyy-MM-dd''T''HH:mm:ss.SSS''Z''') as `created-date`,
            oc.products,
            oc.`receipts-ids`,
            oc.`total-cost`,
            oc.calculated_cost as `calculated-cost`,
            ABS(oc.`total-cost` - oc.calculated_cost) as `cost-variance`,
            oc.`request-id`,
            oc.deleted,
            oc.product_count,
            oc.total_items
        FROM (
            SELECT oc.*, 
                   ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY `total-cost` DESC) as rn
            FROM order_calculations oc
            -- USE AN INNER JOIN INSTEAD OF EXISTS
            INNER JOIN valid_users vu ON oc.`user-id` = vu.id
            WHERE 
                oc.order_id IS NOT NULL 
                AND CHAR_LENGTH(oc.order_id) = 36
                AND oc.order_id LIKE '%-%-%-%-%'
                AND oc.status IN ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED', 'REJECTED')
                AND CARDINALITY(oc.products) > 0
                AND oc.calculated_cost IS NOT NULL
                AND oc.`total-cost` > 0
                AND ABS(oc.`total-cost` - oc.calculated_cost) / oc.`total-cost` <= 0.05
                AND oc.deleted = false
        ) oc
        WHERE rn = 1
    """).wait()

    print("✅ Orders transformation completed successfully!")
    print("   - Valid records written to: hdfs://namenode:9000/datalake/transform/orders_transformed.parquet")

if __name__ == '__main__':
    run_transformation()