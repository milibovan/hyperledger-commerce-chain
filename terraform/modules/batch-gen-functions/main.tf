resource "azurerm_storage_account" "storage_acc" {
  name                     = "stccdev${var.suffix_result}"
  resource_group_name      = var.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = merge({
    Name = "storage-acc-${var.project_name}${var.name_suffix}"
  }, var.tags)
}

resource "azurerm_service_plan" "consumption" {
  name                = "plan-consumption-${var.name_suffix}"
  os_type             = "Linux"
  sku_name            = "Y1"
  resource_group_name = var.name
  location            = var.location
}

resource "azurerm_linux_function_app" "batch-generator" {
  name                = "fn-faker-batch-generator-${var.project_name}${var.name_suffix}"
  resource_group_name = var.name
  location            = var.location

  storage_account_name = azurerm_storage_account.storage_acc.name
  storage_account_access_key = azurerm_storage_account.storage_acc.primary_access_key
  service_plan_id = azurerm_service_plan.consumption.id

  site_config {
    application_stack {
      node_version = "18"
    }
  }
}
