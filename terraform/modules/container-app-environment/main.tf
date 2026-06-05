resource "azurerm_container_app_environment" "app_env" {
  name                     = "app-env-${var.project_name}${var.name_suffix}"
  location                 = var.location
  resource_group_name      = var.name
  infrastructure_subnet_id = var.subnet_id
}