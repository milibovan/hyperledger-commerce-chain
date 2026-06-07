data "confluent_schema_registry_cluster" "schema_registry" {
  environment {
    id = var.env_id
  }

  depends_on = [
    confluent_kafka_cluster.kafka_cluster
  ]
}

resource "confluent_kafka_cluster" "kafka_cluster" {
  display_name = var.cluster_name
  availability = var.availability
  cloud        = var.cloud
  region       = var.region
  basic {}
  environment {
    id = var.env_id
  }
}

resource "confluent_service_account" "app_sa" {
  display_name = "app-stream-governance-sa"
  description  = "Service Account for apps to access Schema Registry and Kafka"
}

resource "confluent_api_key" "schema_registry_key" {
  display_name = "schema-registry-api-key"
  
  owner {
    id          = confluent_service_account.app_sa.id
    api_version = confluent_service_account.app_sa.api_version
    kind        = confluent_service_account.app_sa.kind
  }

  managed_resource {
    id          = data.confluent_schema_registry_cluster.schema_registry.id
    api_version = data.confluent_schema_registry_cluster.schema_registry.api_version
    kind        = data.confluent_schema_registry_cluster.schema_registry.kind

    environment {
      id = var.env_id
    }
  }
}

resource "confluent_api_key" "kafka_cluster_key" {
  display_name = "kafka-cluster-api-key"
  
  owner {
    id          = confluent_service_account.app_sa.id
    api_version = confluent_service_account.app_sa.api_version
    kind        = confluent_service_account.app_sa.kind
  }

  managed_resource {
    id          = confluent_kafka_cluster.kafka_cluster.id
    api_version = confluent_kafka_cluster.kafka_cluster.api_version
    kind        = confluent_kafka_cluster.kafka_cluster.kind

    environment {
      id = var.env_id
    }
  }
}

resource "confluent_role_binding" "app_sa_kafka_admin" {
  principal   = "User:${confluent_service_account.app_sa.id}"
  role_name   = "CloudClusterAdmin"
  crn_pattern = confluent_kafka_cluster.kafka_cluster.rbac_crn
}