variable "topics" {
  description = "List of topics"
  type = set(string)
  default = [ "orders", "products", "receipts", "requests", "traders", "users" ]
}

variable "kafka_cluster_id" {
  description = "Cluster Id"
  type = string
}