resource "confluent_kafka_topic" "orders" {
  kafka_cluster {
    id = var.kafka_cluster_id
  }

  rest_endpoint = var.kafka_rest_endpoint

  credentials {
    key    = var.kafka_api_key
    secret = var.kafka_api_secret
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
