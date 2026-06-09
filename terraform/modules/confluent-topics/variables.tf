variable "topics" {
  description = "List of topics"
  type = set(string)
  default = [ "orders", "products", "receipts", "requests", "traders", "users" ]
}

variable "kafka_cluster_id" {
  type        = string
  description = "The ID of the Kafka cluster"
}

variable "kafka_rest_endpoint" {
  type        = string
  description = "The REST endpoint of the Kafka cluster"
}

variable "kafka_api_key" {
  type        = string
  description = "Cluster API Key used to authenticate topic creation"
}

variable "kafka_api_secret" {
  type        = string
  description = "Cluster API Secret used to authenticate topic creation"
  sensitive   = true
}