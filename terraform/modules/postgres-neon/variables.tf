variable "name_suffix" {
  description = "Suffix for the resource group name"
  type        = string
}

variable "project_name" {
  description = "Suffix for the project name"
  type        = string
}

variable "organization_id" {
  description = "Org id for neon"
  type        = string
}

variable "db_name" {
  description = "Db name neon"
  type        = string
  default = "curated_zone"
}