variable "cloud" {
  description = "Cloud provider"
  type        = string
  default     = "AWS"
}

variable "availability" {
  description = "Availability"
  type        = string
  default     = "SINGLE_ZONE"
}

variable "cluster_name" {
  description = "Kafka cluster name"
  type        = string
  default     = "kafka_cluster"
}

variable "region" {
  description = "Cloud region"
  type        = string
  default     = "us-east-1"
}

variable "env_id" {
  description = "Confluent env id"
  type        = string
}

variable "resource_name" {
  description = "Resource name"
  type        = string
}
