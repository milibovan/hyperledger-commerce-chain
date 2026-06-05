resource "azurerm_container_registry" "acr" {
  name                = "acrdev${var.suffix_result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"

  tags = merge({
    Name = "acr-${var.project_name}${var.name_suffix}"
  }, var.tags)
}