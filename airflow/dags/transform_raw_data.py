from datetime import datetime, timedelta
import logging
import subprocess
import os

from airflow import DAG
from airflow.decorators import task
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.utils.task_group import TaskGroup
from airflow.providers.apache.hdfs.hooks.webhdfs import WebHDFSHook
from airflow.exceptions import AirflowException

# Constants
HDFS_CONN_ID = 'HDFS_CONNECTION'
FLINK_JOBMANAGER_HOST = "jobmanager"
FLINK_JOBMANAGER_PORT = "6123"
FLINK_JOBMANAGER_WEB_PORT = "8081"
SCRIPT_SOURCE_DIR = "/opt/airflow/files/flink/my_jobs"

# Default arguments
default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

def submit_pyflink_job(script_name, parallelism=1, **context):
    """Submit PyFlink job using Flink CLI"""
    source_file_path = os.path.join(SCRIPT_SOURCE_DIR, script_name)
    
    if not os.path.exists(source_file_path):
        raise FileNotFoundError(f"Source script not found at {source_file_path}")

    cmd = [
        'flink', 'run',
        '-t', 'remote',
        f'-Djobmanager.rpc.address={FLINK_JOBMANAGER_HOST}',
        f'-Djobmanager.rpc.port={FLINK_JOBMANAGER_PORT}',
        f'-Dparallelism.default={parallelism}',
        '-py', source_file_path
    ]
    
    logging.info(f"Executing command: {' '.join(cmd)}")
    
    env = os.environ.copy()
    
    result = subprocess.run(
        cmd,
        env=env,
        capture_output=True,
        text=True,
        timeout=300
    )
    
    if result.returncode != 0:
        logging.error(f"STDOUT: {result.stdout}")
        logging.error(f"STDERR: {result.stderr}")
        raise AirflowException(f"Flink job {script_name} failed: {result.stderr}")
    
    logging.info(f"Job output: {result.stdout}")
    
    # Extract and log job ID
    job_id = None
    for line in result.stdout.split('\n'):
        if 'Job has been submitted with JobID' in line:
            job_id = line.split('JobID')[-1].strip()
            logging.info(f"Job ID: {job_id}")
            break
    
    return job_id

with DAG(
    'flink_hdfs_transformation_pipeline',
    default_args=default_args,
    description='Transform raw JSONL to Parquet using PyFlink via CLI',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['flink', 'hdfs', 'pyflink'],
) as dag:

    @task
    def check_hdfs_path(path):
        """Check if HDFS path exists"""
        hdfs_hook = WebHDFSHook(webhdfs_conn_id=HDFS_CONN_ID)
        if hdfs_hook.check_for_path(hdfs_path=path):
            logging.info(f"✓ Path {path} exists")
            return True
        raise AirflowException(f"✗ Path {path} not found.")

    @task
    def verify_hdfs_output(table_name):
        """Verify transformed output exists in HDFS"""
        hdfs_hook = WebHDFSHook(webhdfs_conn_id=HDFS_CONN_ID)
        file_part = "product_requests" if table_name == "order_requests" else table_name
        path = f"/datalake/transform/{file_part}_transformed.parquet"
        
        if hdfs_hook.check_for_path(hdfs_path=path):
            logging.info(f"✓ Output {path} verified")
            return True
        raise AirflowException(f"✗ Expected output {path} missing!")

    # Top level checks
    hdfs_check = check_hdfs_path("/datalake/raw/")
    
    check_flink = BashOperator(
        task_id='check_flink_cluster',
        bash_command=f"curl -f http://{FLINK_JOBMANAGER_HOST}:{FLINK_JOBMANAGER_WEB_PORT}/overview || exit 1",
    )

    # Layer 1: Independent transformations
    with TaskGroup('layer_1_independent') as layer_1:
        trans_u = PythonOperator(
            task_id='transform_users',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_users.py'}
        )
        v_u = verify_hdfs_output.override(task_id='verify_users')("users")
        trans_u >> v_u

        trans_t = PythonOperator(
            task_id='transform_traders',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_traders.py'}
        )
        v_t = verify_hdfs_output.override(task_id='verify_traders')("traders")
        trans_t >> v_t

    # Layer 2: Products (depends on layer 1)
    with TaskGroup('layer_2_products') as layer_2:
        trans_p = PythonOperator(
            task_id='transform_products',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_products.py'}
        )
        v_p = verify_hdfs_output.override(task_id='verify_products')("products")
        trans_p >> v_p

    # Layer 3: Orders (depends on layer 2)
    with TaskGroup('layer_3_orders') as layer_3:
        trans_o = PythonOperator(
            task_id='transform_orders',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_orders.py', 'parallelism': 4}
        )
        v_o = verify_hdfs_output.override(task_id='verify_orders')("orders")
        trans_o >> v_o

    # Layer 4: Complex transformations (depends on layer 3)
    with TaskGroup('layer_4_complex') as layer_4:
        trans_rec = PythonOperator(
            task_id='transform_receipts',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_receipts.py'}
        )
        v_rec = verify_hdfs_output.override(task_id='verify_receipts')("receipts")
        trans_rec >> v_rec

        trans_req = PythonOperator(
            task_id='transform_order_requests',
            python_callable=submit_pyflink_job,
            op_kwargs={'script_name': 'transform_order_requests.py'}
        )
        v_req = verify_hdfs_output.override(task_id='verify_order_requests')("order_requests")
        trans_req >> v_req

    @task
    def finalize_pipeline():
        """Final cleanup and logging"""
        logging.info("✓ All PyFlink jobs submitted and outputs verified successfully!")
        return "Pipeline complete"

    # Define task flow
    [hdfs_check, check_flink] >> layer_1 >> layer_2 >> layer_3 >> layer_4 >> finalize_pipeline()