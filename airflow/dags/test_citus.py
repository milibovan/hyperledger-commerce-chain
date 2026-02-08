from airflow import DAG
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from datetime import datetime

with DAG(
    dag_id='test_citus_connection',
    start_date=datetime(2023, 1, 1),
    schedule=None,
    catchup=False,
    tags=['citus']
) as dag:

    check_citus = SQLExecuteQueryOperator(
        task_id='check_citus_version',
        conn_id='citus',
        sql="SELECT citus_version();",
    )
