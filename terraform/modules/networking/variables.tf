variable "vnet_address_space" {
  description = "Address space for Virtual Network"
  type        = list(string)
}

variable "compute_subnet_address_prefix" {
  description = "Address prefix for compute subnet"
  type        = list(string)
}

variable "name_suffix" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "project_name" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the resource group"
  type        = map(string)
  default     = {}
}