resource "upstash_redis_database" "redis" {
  database_name = "${var.project_name}${var.name_suffix}"
  region = var.region
  tls = "true"
}