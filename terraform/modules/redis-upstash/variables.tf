variable "name_suffix" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "project_name" {
  description = "Suffix for the project name"
  type        = string
}

variable "region" {
  description = "Upstash db region"
  type = string
  default = "us-east-1"
}