#!/bin/bash

cd ../flink

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/raw/load-data.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/transform/transform-data.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/queries/completed_orders.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/queries/fraud_detection.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/queries/congestion_coefficient.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/queries/whale_orders.sql

docker compose exec jobmanager ./bin/sql-client.sh -f ./stream-scripts/queries/wanted_products.sql