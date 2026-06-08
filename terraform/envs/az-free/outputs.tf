output "static_web_app_api_token" {
  value     = module.frontend.static_web_app_api_token
  sensitive = true
}