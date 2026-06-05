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
    id          = data.confluent_schema_registry_cluster.essentials.id
    api_version = data.confluent_schema_registry_cluster.essentials.api_version
    kind        = data.confluent_schema_registry_cluster.essentials.kind

    environment {
      id = var.env_id
    }
  }
}