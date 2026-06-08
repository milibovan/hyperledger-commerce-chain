output "sr_endpoint" {
  description = "Schema registry endpoint"
  value = data.confluent_schema_registry_cluster.schema_registry.rest_endpoint
}

output "sr_id" {
  description = "Schema registry id"
  value = data.confluent_schema_registry_cluster.schema_registry.id
}

output "kafka_cluster_id" {
  description = "Cluster id"
  value = confluent_kafka_cluster.kafka_cluster.id
}