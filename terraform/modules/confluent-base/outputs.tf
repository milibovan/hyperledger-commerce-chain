output "sr_endpoint" {
  description = "Schema registry endpoint"
  value = data.confluent_schema_registry_cluster.schema_registry.rest_endpoint
}

output "sr_id" {
  description = "Schema registry id"
  value = data.confluent_schema_registry_cluster.schema_registry.id
}