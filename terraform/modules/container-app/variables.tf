variable "name_suffix" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "project_name" {
  description = "Suffix for the project name"
  type        = string
}

variable "resource_group_name" {
  description = "Suffix for the project name"
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

variable "apps" {
  description = "Apps"
  type = set(string)
  default = [ "airflow", "email-service", "go-backend", "superset", "stream-generator"]
}

variable "cpu_allocation" {
  description = "CPU allocation for container"
  type = number
  default = 0.25
}

variable "memory_allocation" {
  description = "Memory allocation for container"
  type = number
  default = 0.5
}