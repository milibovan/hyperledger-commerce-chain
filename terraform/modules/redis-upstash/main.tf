resource "upstash_redis_database" "redis" {
  database_name  = "${var.project_name}${var.name_suffix}"
  region         = "global"
  primary_region = "eu-west-1"
  tls            = "true"
}
