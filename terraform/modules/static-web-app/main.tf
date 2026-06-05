resource "azurerm_static_web_app" "commerce-chain-frontend" {
  name                = "web-app-${var.project_name}${var.name_suffix}"
  location            = var.location
  resource_group_name = var.name
  sku_size            = "Free"
  sku_tier            = "Free"

  tags = merge({
    Name = "web-app-${var.project_name}${var.name_suffix}"
  }, var.tags)
}
