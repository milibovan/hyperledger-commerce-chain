resource "neon_project" "commerce-chain" {
  name                      = "${var.project_name}${var.name_suffix}"
  pg_version                = 16
  region_id                 = "aws-us-east-1"
  org_id                    = var.organization_id
  history_retention_seconds = 21600

  default_endpoint_settings {
    autoscaling_limit_min_cu = 0.25
    autoscaling_limit_max_cu = 1.0
  }
}

resource "neon_role" "app_user" {
  project_id = neon_project.commerce-chain.id
  branch_id  = neon_project.commerce-chain.default_branch_id
  name       = "app_user"
}

resource "neon_database" "citus_db" {
  project_id = neon_project.commerce-chain.id
  branch_id  = neon_project.commerce-chain.default_branch_id
  name       = var.db_name
  owner_name = neon_role.app_user.name
}

# resource "neon_api_key" "ci_cd_key" {
#   name = "automation-key-for-ci"
# }