from datetime import datetime
from airflow import DAG
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator

with DAG(
    dag_id='create_test_streams_table',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
) as dag:

    SQLExecuteQueryOperator(
        task_id='create_test_streams_table',
        conn_id='citus',
        sql="""
            CREATE TABLE IF NOT EXISTS test_streams (
                event_id       TEXT,
                entity_id      TEXT,
                correlation_id TEXT,
                causation_id   TEXT,
                event_ts       BIGINT,
                name           TEXT,
                surname        TEXT,
                email          TEXT,
                balance        REAL,
                dt             TEXT
            );

            CREATE TABLE IF NOT EXISTS completed_orders (
                event_ts          BIGINT,
                user_id           TEXT,
                trader_id         TEXT,
                total_cost        REAL,
                due_date          BIGINT,
                product_id        TEXT,
                quantity          BIGINT,
                price             REAL
            );

            CREATE TABLE IF NOT EXISTS fraud_detection (
                event_ts          BIGINT,
                user_id           TEXT PRIMARY KEY,
                user_name         TEXT,
                user_surname      TEXT,
                user_email        TEXT,
                user_balance      REAL
            );

            CREATE TABLE IF NOT EXISTS congestion_coefficient (
                events_number             BIGINT,
                new_orders                BIGINT,
                finished_orders           BIGINT,
                congestion_coefficient    REAL
            );

            CREATE TABLE IF NOT EXISTS whale_orders (
                entity_id     TEXT PRIMARY KEY,
                user_id       TEXT,
                user_name     TEXT,
                user_surname  TEXT,
                user_email    TEXT,
                user_balance  REAL,
                total_cost    REAL,
                product_id    TEXT,
                quantity      BIGINT,
                price         REAL
            );

            CREATE TABLE IF NOT EXISTS wanted_products (
                sales_product_id      TEXT PRIMARY KEY,
                sales_growts_prc      DOUBLE PRECISION,
                sales_coeff           DOUBLE PRECISION,
                sales_users           BIGINT,
                demand_product_id     TEXT,
                demand_growts_prc     DOUBLE PRECISION,
                demand_coeff          DOUBLE PRECISION,
                demand_users          BIGINT,
                total_coeff           DOUBLE PRECISION
            );
        """,
    )