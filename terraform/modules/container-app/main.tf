resource "azurerm_container_app_environment" "apps_env" {
  name                = "${var.project_name}${var.name_suffix}-env"
  location            = var.location
  resource_group_name = var.name
}

resource "azurerm_container_app" "apps" {
  for_each                     = var.apps
  name                         = each.key
  container_app_environment_id = var.container_app_environment_id
  resource_group_name          = var.name
  revision_mode                = "Single"

  template {
    container {
      name   = each.key
      image  = "mcr.microsoft.com/k8se/quickstart:latest"
      cpu    = var.cpu_allocation
      memory = var.memory_allocation
    }
    min_replicas = 0
    max_replicas = 1
  }
}
