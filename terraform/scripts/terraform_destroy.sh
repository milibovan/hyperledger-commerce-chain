#!/bin/bash

set -e

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found in the current directory."
    exit 1
fi

cd ../envs/az-main/

subscription_master=$(vault kv get -mount="kv" -field="subscription_id_master" "secrets/azure")
subscription_free=$(vault kv get -mount="kv" -field="subscription_id_free" "secrets/azure")

az account set --subscription "$subscription_master"

echo -e "\n************** DESTROY **********************\n"
terraform destroy -auto-approve

cd ../az-free/

az account set --subscription "$subscription_free"

echo -e "\n************** DESTROY **********************\n"
terraform destroy -auto-approve

cd ../confluent/

echo -e "\n************** DESTROY **********************\n"
terraform destroy -auto-approve