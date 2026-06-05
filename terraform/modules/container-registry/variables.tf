variable "name_suffix" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "project_name" {
  description = "Suffix for the project name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to the resource group"
  type        = map(string)
  default     = {}
}

variable "suffix_result" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Resource group location"
  type        = string
}