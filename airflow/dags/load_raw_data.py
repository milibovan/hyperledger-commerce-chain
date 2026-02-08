from datetime import datetime
from airflow.sdk import dag, task
from airflow.providers.apache.hdfs.hooks.webhdfs import WebHDFSHook
import os

@dag(
    dag_id="load_raw_data",
    description="This id DAG for loading raw data to HDFS",
    start_date=datetime(2026, 1, 28),
    max_active_runs=1,
    catchup=False,
    tags=['hdfs']
)

def load_raw_data():
    airflow_home = os.environ.get('AIRFLOW_HOME', '/opt/airflow')

    @task
    def load_data(local_path: str):
        hdfs_hook = WebHDFSHook(webhdfs_conn_id="HDFS_CONNECTION")
        filename = os.path.basename(local_path)
        hdfs_destination = os.path.join("/datalake/raw", filename) 
        
        hdfs_hook.load_file(
            source=local_path, 
            destination=hdfs_destination, 
            overwrite=True
        )
        return hdfs_destination

    @task
    def check_hdfs_file(path):
        hdfs_hook = WebHDFSHook(webhdfs_conn_id="HDFS_CONNECTION")
        if hdfs_hook.check_for_path(hdfs_path=path):
            print(f"File {path} found in HDFS.")
        else:
            print(f"File {path} not found.")

    data_dir = os.path.join(airflow_home, "files")
    files_to_load = [
        os.path.join(data_dir, f) for f in os.listdir(data_dir) 
        if f.endswith('.jsonl')
    ]

    for file_path in files_to_load:
        hdfs_path = load_data(file_path)
        check_hdfs_file(hdfs_path)

load_raw_data()