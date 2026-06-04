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