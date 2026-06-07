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

resource "azurerm_storage_container" "raw_zone" {
  name                  = "raw-zone-sc-${var.project_name}${var.name_suffix}"
  storage_account_name  = azurerm_storage_account.storage_acc.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "transform_zone" {
  name                  = "transform-zone-sc-${var.project_name}${var.name_suffix}"
  storage_account_name  = azurerm_storage_account.storage_acc.name
  container_access_type = "private"
}