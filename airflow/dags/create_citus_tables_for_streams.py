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
        """,
    )