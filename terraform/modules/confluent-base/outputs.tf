output "sr_endpoint" {
  description = "Schema registry endpoint"
  value       = data.confluent_schema_registry_cluster.schema_registry.rest_endpoint
}

output "sr_id" {
  description = "Schema registry id"
  value       = data.confluent_schema_registry_cluster.schema_registry.id
}

output "sr_api_key" {
  description = "Schema registry api key"
  value       = confluent_api_key.schema_registry_key.id
}

output "sr_api_secret" {
  description = "Schema registry api key"
  sensitive   = true
  value       = confluent_api_key.schema_registry_key.secret
}

output "kafka_cluster_id" {
  value = confluent_kafka_cluster.kafka_cluster.id
}

output "kafka_rest_endpoint" {
  value = confluent_kafka_cluster.kafka_cluster.rest_endpoint
}

output "kafka_api_key" {
  value = confluent_api_key.kafka_cluster_key.id
}

output "kafka_api_secret" {
  value     = confluent_api_key.kafka_cluster_key.secret
  sensitive = true
}

output "debug_sr_resource_name" {
  value = data.confluent_schema_registry_cluster.schema_registry.resource_name
}