resource "azurerm_container_registry" "acr" {
  name                = "acrdev${var.suffix_result}"
  resource_group_name = var.name
  location            = var.location
  sku                 = "Basic"

  tags = merge({
    Name = "acr-${var.project_name}${var.name_suffix}"
  }, var.tags)
}