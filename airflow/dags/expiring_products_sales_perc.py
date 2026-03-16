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
import pyarrow.parquet as pq
import pyarrow as pa

SCRIPT_SOURCE_DIR    = "/opt/airflow/files/flink/my_jobs"
FLINK_JOBMANAGER_HOST = "flink-jobmanager-1"
FLINK_JOBMANAGER_PORT = "8081"
HDFS_CONN_ID         = "HDFS_CONNECTION"


def submit_pyflink_job(script_name, parallelism=1, **context):
    source_file_path = os.path.join(SCRIPT_SOURCE_DIR, script_name)

    if not os.path.exists(source_file_path):
        raise FileNotFoundError(f"Source script not found at {source_file_path}")

    # ── Step 1: validate the script runs without import/syntax errors ──────
    logging.info(f"=== Validating Python script: {source_file_path} ===")
    test_result = subprocess.run(
        ['python3', source_file_path],
        capture_output=True,
        text=True,
        cwd=SCRIPT_SOURCE_DIR,
        timeout=120,
    )
    logging.info(f"Validation STDOUT:\n{test_result.stdout}")
    logging.info(f"Validation STDERR:\n{test_result.stderr}")

    if test_result.returncode != 0:
        raise AirflowException(
            f"Python script validation failed (exit {test_result.returncode}):\n"
            f"STDOUT:\n{test_result.stdout}\n"
            f"STDERR:\n{test_result.stderr}"
        )

    # ── Step 2: submit to Flink ────────────────────────────────────────────
    cmd = [
        'flink', 'run',
        '-t', 'remote',
        f'-Djobmanager.rpc.address={FLINK_JOBMANAGER_HOST}',
        f'-Djobmanager.rpc.port={FLINK_JOBMANAGER_PORT}',
        f'-Dparallelism.default={parallelism}',
        # Java module opens required for newer JDKs
        '-Denv.java.opts.all='
        '--add-opens java.base/java.util=ALL-UNNAMED '
        '--add-opens java.base/java.lang=ALL-UNNAMED '
        '--add-opens java.base/java.net=ALL-UNNAMED '
        '--add-opens java.base/java.io=ALL-UNNAMED '
        '--add-opens java.base/java.lang.invoke=ALL-UNNAMED',
        '-py', source_file_path,
    ]

    logging.info(f"=== Submitting Flink job ===\n{' '.join(cmd)}")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=SCRIPT_SOURCE_DIR,
        timeout=3600,
    )

    # Always log both streams in full
    logging.info(f"Flink STDOUT:\n{result.stdout}")
    logging.info(f"Flink STDERR:\n{result.stderr}")   # info, not error — avoid truncation

    if result.returncode != 0:
        raise AirflowException(
            f"Flink job failed (exit {result.returncode}):\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )

    logging.info("=== Flink job completed successfully ===")
    return result.stdout


with DAG(
    dag_id='expiring_products_sales',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=['flink', 'citus'],
) as dag:

    check_citus = SQLExecuteQueryOperator(
        task_id='check_citus_connection',
        conn_id='citus',
        sql="SELECT 1;",
    )

    create_table = SQLExecuteQueryOperator(
        task_id='create_citus_table',
        conn_id='citus',
        sql="""
            DROP TABLE IF EXISTS expiring_products_sales_perc;

            CREATE TABLE IF NOT EXISTS expiring_products_sales_perc (
                week                 INTEGER,
                year                 INTEGER,
                trader_type          VARCHAR(36),
                product_id           VARCHAR(66),
                product_name         VARCHAR(66),
                days_until_expiry    BIGINT,
                near_expiry_sales    BIGINT,
                total_category_sales BIGINT,
                percentage           DOUBLE PRECISION
            );
        """,
    )

    @task
    def check_hdfs_path(path):
        hdfs_hook = WebHDFSHook(webhdfs_conn_id=HDFS_CONN_ID)
        conn = hdfs_hook.get_conn()

        if not hdfs_hook.check_for_path(hdfs_path=path):
            raise AirflowException(f"HDFS path not found: {path}")
        logging.info(f"HDFS path confirmed: {path}")

        files = {
            "products": "/datalake/transform/products_transformed.parquet",
            "receipts": "/datalake/transform/receipts_transformed.parquet",
        }

        for name, hdfs_path in files.items():
            file_list = conn.list(hdfs_path)

            if not file_list:
                raise AirflowException(f"No files found in {hdfs_path}")

            tables = []
            for f in file_list:
                full_path = f"{hdfs_path}/{f}"
                with conn.read(full_path) as reader:
                    data = reader.read()
                tables.append(pq.read_table(pa.BufferReader(data)))

            table = pa.concat_tables(tables)

            logging.info(f"{name} row count: {table.num_rows}")
            logging.info(f"{name} schema: {table.schema}")
            logging.info(f"{name} sample:\n{table.slice(0, 5).to_pandas()}")

        return path

    avg_calc = PythonOperator(
        task_id='flink_avg_calc',
        python_callable=submit_pyflink_job,
        op_kwargs={'script_name': 'expiring_products_sales_perc.py'},
    )

    verify_citus_data = SQLExecuteQueryOperator(
        task_id='verify_citus_results',
        conn_id='citus',
        sql="SELECT COUNT(*) FROM expiring_products_sales_perc;",
    )

    hdfs_input_path = check_hdfs_path("/datalake/transform/")

    check_citus >> create_table >> hdfs_input_path >> avg_calc >> verify_citus_data