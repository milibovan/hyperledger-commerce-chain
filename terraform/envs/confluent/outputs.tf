output "env_id" {
  value = confluent_environment.dev.id
}
output "pool_id" {
  value = confluent_flink_compute_pool.main.id
}