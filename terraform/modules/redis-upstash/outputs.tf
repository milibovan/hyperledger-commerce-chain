output "db_id" {
  description = "Db id"
  value = upstash_redis_database.redis.database_id
}