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
az provider register --namespace Microsoft.App

echo -e "\n************** APPLY **********************\n"
terraform apply -auto-approve tfplan

cd ../az-free/

az account set --subscription "$subscription_free"

echo -e "\n************** APPLY **********************\n"
terraform apply -auto-approve tfplan

cd ../confluent/

echo -e "\n************** APPLY **********************\n"
terraform apply -auto-approve tfplan