from datetime import datetime
from airflow import DAG
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

QUERY_DAGS_ORDERED = [
    "avg_request_fullfilment",
    "weekly_loss",
    "versatile_buyers",
    "average_purchase",
    "expiring_products_sales",
    "rank_traders",
    "avg_price_and_quantity",
    "unsuccessful_requests_value",
    "inventory_value",
    "avg_product_diversity",
]


def chain_dag(dag, dag_id, previous_task):
    trigger = TriggerDagRunOperator(
        task_id=f"trigger_{dag_id}",
        trigger_dag_id=dag_id,
        wait_for_completion=True,
        reset_dag_run=True,
        dag=dag,
    )
    previous_task >> trigger
    return trigger


with DAG(
    dag_id="query_orchestrator",
    description="Runs the full pipeline end-to-end in one trigger",
    start_date=datetime(2026, 6, 6),
    catchup=False,
    tags=["orchestrator", "pipeline"],
) as dag:

    first_dag_id = QUERY_DAGS_ORDERED[0]
    last = TriggerDagRunOperator(
        task_id=f"trigger_{first_dag_id}",
        trigger_dag_id=first_dag_id,
        wait_for_completion=True,
        reset_dag_run=True,
    )

    for dag_id in QUERY_DAGS_ORDERED[1:]:
        last = chain_dag(dag, dag_id, last)