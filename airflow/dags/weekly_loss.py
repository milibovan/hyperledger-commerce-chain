import os
import subprocess
import logging
from datetime import datetime
from airflow import DAG
from airflow.decorators import task
from airflow.operators.python import PythonOperator
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from airflow.providers.apache.hdfs.hooks.webhdfs import WebHDFSHook
from airflow.exceptions import AirflowException

SCRIPT_SOURCE_DIR = "/opt/airflow/files/flink/my_jobs"
FLINK_JOBMANAGER_HOST = "flink-jobmanager-1"
FLINK_JOBMANAGER_PORT = "8081"
HDFS_CONN_ID = "HDFS_CONNECTION"

def submit_pyflink_job(script_name, parallelism=1, **context):
    source_file_path = os.path.join(SCRIPT_SOURCE_DIR, script_name)
    
    if not os.path.exists(source_file_path):
        raise FileNotFoundError(f"Source script not found at {source_file_path}")
    
    # First, try running the script directly to see Python errors
    logging.info(f"Testing Python script execution: {source_file_path}")
    test_cmd = ['python3', source_file_path]
    test_result = subprocess.run(test_cmd, capture_output=True, text=True, cwd=SCRIPT_SOURCE_DIR)
    
    logging.info(f"Direct Python execution STDOUT:\n{test_result.stdout}")
    logging.info(f"Direct Python execution STDERR:\n{test_result.stderr}")
    
    if test_result.returncode != 0:
        raise AirflowException(
            f"Python script validation failed:\n"
            f"STDOUT: {test_result.stdout}\n"
            f"STDERR: {test_result.stderr}"
        )
    
    # Now submit to Flink
    cmd = [
        'flink', 'run',
        '-t', 'remote',
        f'-Djobmanager.rpc.address={FLINK_JOBMANAGER_HOST}',
        f'-Djobmanager.rpc.port={FLINK_JOBMANAGER_PORT}',
        f'-Dparallelism.default={parallelism}',
        '-Denv.java.opts.all=--add-opens java.base/java.util=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.net=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED',
        '-py', source_file_path
    ]
    
    logging.info(f"Submitting to Flink: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=SCRIPT_SOURCE_DIR)
    
    logging.info(f"Flink submission STDOUT:\n{result.stdout}")
    logging.error(f"Flink submission STDERR:\n{result.stderr}")
    
    if result.returncode != 0:
        raise AirflowException(
            f"Flink job failed with return code {result.returncode}:\n"
            f"STDOUT: {result.stdout}\n"
            f"STDERR: {result.stderr}"
        )
    
    return result.stdout

with DAG(
    dag_id='weekly_loss',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=['flink', 'citus', 'hdfs']
) as dag:
    
    check_citus = SQLExecuteQueryOperator(
        task_id='check_citus_connection',
        conn_id='citus',
        sql="SELECT 1;",
    )

    # drop_table = SQLExecuteQueryOperator(
    #     task_id='drop_old_citus_table',
    #     conn_id='citus',
    #     sql="DROP TABLE IF EXISTS weekly_loss;",
    # )

    create_table = SQLExecuteQueryOperator(
        task_id='create_citus_table',
        conn_id='citus',
        sql="""
            CREATE TABLE IF NOT EXISTS weekly_loss (
                week INTEGER,
                cumulative_loss DOUBLE PRECISION,
                trader_id VARCHAR(36),
                year INTEGER
            );
        """,
    )
    
    @task
    def check_hdfs_path(path):
        hdfs_hook = WebHDFSHook(webhdfs_conn_id=HDFS_CONN_ID)
        if not hdfs_hook.check_for_path(hdfs_path=path):
            raise AirflowException(f"Path {path} not found.")
        return path
    
    weekly_loss = PythonOperator(
        task_id='flink_weekly_loss',
        python_callable=submit_pyflink_job,
        op_kwargs={'script_name': 'weekly_loss.py'}
    )
    
    verify_citus_data = SQLExecuteQueryOperator(
        task_id='verify_citus_results',
        conn_id='citus',
        sql="SELECT COUNT(*) FROM weekly_loss;",
    )
    
    hdfs_input_path = check_hdfs_path("/datalake/transform/")
    
    check_citus >> hdfs_input_path >> create_table >> weekly_loss >> verify_citus_data