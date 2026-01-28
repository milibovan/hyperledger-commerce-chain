from airflow import DAG
from airflow.providers.http.operators.http import SimpleHttpOperator
from datetime import datetime
import json

with DAG(
    dag_id="flink_transform_via_http",
    start_date=datetime(2026, 1, 28),
    catchup=False
) as dag:

    # Submit the PyFlink job via Flink's REST API
    # Note: This usually involves uploading a JAR/Script first, 
    # but for Flink SQL, you can send the statement directly.
    submit_transform = SimpleHttpOperator(
        task_id="submit_flink_job",
        http_conn_id="flink_rest_api",
        endpoint="/jars/upload", # Or your specific job submission endpoint
        method="POST",
        data=json.dumps({
            "entryClass": "org.apache.flink.client.python.PythonDriver",
            "programArgs": ["--python", "/opt/flink/usrlib/transform_orders.py"]
        }),
        headers={"Content-Type": "application/json"},
    )