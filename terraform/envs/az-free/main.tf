data "azurerm_subscription" "current" {}

resource "random_string" "suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = false
  special = false
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

module "frontend" {
  source       = "../../modules/static-web-app"
  name         = azurerm_resource_group.main.name
  location     = azurerm_resource_group.main.location
  name_suffix  = local.name_suffix
  project_name = local.project_name
  tags         = local.tags
}

resource "azurerm_resource_group" "main" {
  name     = "rg-free-${local.project_name}${local.name_suffix}"
  location = var.location

  tags = merge({
    Name = "rg-free-${local.project_name}${local.name_suffix}"
  }, local.tags)
}

module "container_app_env_main" {
  source       = "../../modules/container-app-environment"
  name         = azurerm_resource_group.main.name
  location     = azurerm_resource_group.main.location
  name_suffix  = local.name_suffix
  project_name = local.project_name
  subnet_id    = module.networking.azurerm_subnet_id
}

module "container_apps" {
  source                       = "../../modules/container-app"
  name_suffix                  = local.name_suffix
  project_name                 = local.project_name
  name                         = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  container_app_environment_id = module.container_app_env_main.env_id
  cpu_allocation               = 0.25
  memory_allocation            = "0.5Gi"
  apps                         = ["go-backend", "email-service", "stream-generator"]
}
