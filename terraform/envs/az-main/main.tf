data "azurerm_subscription" "current" {}

resource "random_string" "suffix" {
  length  = 8
  upper   = true
  lower   = true
  numeric = true
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
}

module "container_registry" {
  source        = "../../modules/container-registry"
  suffix_result = random_string.suffix.result
  name_suffix   = local.name_suffix
  project_name  = local.project_name
  tags          = local.tags
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

resource "azurerm_container_app_environment" "app_env" {
  name                     = "app-env-${local.project_name}${local.name_suffix}"
  location                 = azurerm_resource_group.main.location
  resource_group_name      = azurerm_resource_group.main.name
  infrastructure_subnet_id = module.networking.azurerm_subnet_id
}

module "frontend" {
  source        = "../../modules/static-web-app"
  name          = azurerm_resource_group.main.name
  location      = azurerm_resource_group.main.location
  name_suffix   = local.name_suffix
  project_name  = local.project_name
  tags          = local.tags
}
