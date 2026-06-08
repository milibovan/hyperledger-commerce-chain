data "azurerm_subscription" "current" {}

resource "random_string" "suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = false
  special = false
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.project_name}${local.name_suffix}"
  location = var.location

  tags = merge({
    Name = "rg-${local.project_name}${local.name_suffix}"
  }, local.tags)
}

module "networking" {
  source                        = "../../modules/networking"
  vnet_address_space            = var.vnet_address_space
  compute_subnet_address_prefix = var.compute_subnet_address_prefix
  name_suffix                   = local.name_suffix
  project_name                  = local.project_name
  tags                          = local.tags
  name                          = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
}

module "container_registry" {
  source        = "../../modules/container-registry"
  suffix_result = random_string.suffix.result
  name_suffix   = local.name_suffix
  project_name  = local.project_name
  tags          = local.tags
  name          = azurerm_resource_group.main.name
  location      = azurerm_resource_group.main.location
}

module "storage" {
  source        = "../../modules/storage"
  name          = azurerm_resource_group.main.name
  location      = azurerm_resource_group.main.location
  suffix_result = random_string.suffix.result
  name_suffix   = local.name_suffix
  project_name  = local.project_name
  tags          = local.tags
}

module "container_app_env_main" {
  source       = "../../modules/container-app-environment"
  name         = azurerm_resource_group.main.name
  location     = azurerm_resource_group.main.location
  name_suffix  = local.name_suffix
  project_name = local.project_name
  subnet_id    = module.networking.azurerm_subnet_id
}

module "container_app_env_poland" {
  source       = "../../modules/container-app-environment"
  name         = "${local.project_name}${local.name_suffix}-pl-env"
  location     = "polandcentral"
  name_suffix  = local.name_suffix
  project_name = local.project_name
  
  subnet_id    = null 
}

module "budget_alert" {
  source          = "../../modules/budget-alert"
  email           = var.alert_email
  subscription_id = data.azurerm_subscription.current.id
  amount          = 100
}

module "citus_db" {
  source          = "../../modules/postgres-neon"
  organization_id = data.vault_kv_secret_v2.neon_secrets.data["ORG_ID"]
  name_suffix     = local.name_suffix
  project_name    = local.project_name
  db_name         = var.citus_db_name
}

module "redis" {
  source       = "../../modules/redis-upstash"
  name_suffix  = local.name_suffix
  project_name = local.project_name
}

module "airflow" {
  source               = "../../modules/container-app"
  name_suffix          = local.name_suffix
  project_name         = local.project_name
  name                 = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  
  container_app_environment_id = module.container_app_env_main.env_id
  
  cpu_allocation       = 0.5
  memory_allocation    = "1.0Gi"
  apps                 = ["airflow"]
}

module "superset" {
  source               = "../../modules/container-app"
  name_suffix          = local.name_suffix
  project_name         = local.project_name
  name                 = azurerm_resource_group.main.name
  location             = "polandcentral"
  
  container_app_environment_id = module.container_app_env_poland.env_id
  
  cpu_allocation       = 0.5
  memory_allocation    = "1.0Gi"
  apps                 = ["superset"]
}

module "batch-generator" {
  source        = "../../modules/batch-gen-functions"
  name_suffix   = local.name_suffix
  suffix_result = random_string.suffix.result
  project_name  = local.project_name
  name          = azurerm_resource_group.main.name
  location      = azurerm_resource_group.main.location
  tags          = local.tags
}