output "static_web_app_api_token" {
  value     = azurerm_static_web_app.commerce-chain-frontend.api_key
  sensitive = true
}