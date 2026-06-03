variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "polandcentral"
}

variable "environment" {
  description = "Environment name for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "vnet_address_space" {
  description = "Address space for Virtual Network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "compute_subnet_address_prefix" {
  description = "Address prefix for compute subnet"
  type        = list(string)
  default     = ["10.0.1.0/23"]
}

variable "acr_name" {
  description = "Name for acr (due to being globally unique)"
  type        = string
  default     = "acrdev${random_string.suffix.result}"
}

variable "storage_acc_name" {
  description = "Name for storage account (due to being globally unique)"
  type        = string
  default     = "stccdev${random_string.suffix.result}"
}

# variable "confluent_cloud_api_key" {
#   type        = string
#   description = "API_KEY for Confluent Cloud"
# }

# variable "confluent_cloud_api_secret" {
#   type        = string
#   description = "API_SECRET_KEY for Confluent Cloud"
# }