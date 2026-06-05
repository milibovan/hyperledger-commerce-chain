resource "confluent_environment" "dev" {
  display_name = "dev"
}

data "confluent_schema_registry_cluster" "essentials" {
  environment {
    id = confluent_environment.dev.id
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
    id = confluent_environment.dev.id
  }
}