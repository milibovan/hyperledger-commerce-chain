variable "schemas" {
  description = "List of schemas"
  type        = set(string)
  default     = ["orders", "products", "receipts", "requests", "traders", "users"]
}

variable "sr_endpoint" {
  description = "Schema registry endpoint"
  type        = string
}

variable "sr_id" {
  description = "Schema registry id"
  type        = string
}