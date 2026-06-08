data "azurerm_subscription" "current" {}

resource "random_string" "suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = false
  special = false
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

module "container_apps" {
  source              = "../../modules/container-app"
  name_suffix         = local.name_suffix
  project_name        = local.project_name
  name                = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  cpu_allocation      = 0.25
  memory_allocation   = "0.5Gi"
  apps                = ["go-backend", "email-service", "stream-generator"]
}
