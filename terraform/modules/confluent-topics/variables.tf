variable "topics" {
  description = "List of topics"
  type = set(string)
  default = [ "orders", "products", "receipts", "requests", "traders", "users" ]
}