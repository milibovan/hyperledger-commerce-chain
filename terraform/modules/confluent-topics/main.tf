resource "confluent_kafka_topic" "orders" {
  kafka_cluster {
    id = confluent_kafka_cluster.kafka_cluster.id
  }

  for_each         = var.topics
  topic_name       = each.key
  partitions_count = 3

  config = {
    "min.insync.replicas" = "2"
    "cleanup.policy"      = "delete"
    "retention.ms"        = "604800000"
  }
}
