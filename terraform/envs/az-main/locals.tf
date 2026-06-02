locals {
  project_name = "commerce-chain"
  name_suffix  = "-${var.environment}"

  tags = {
    ManagedBy    = "Terraform",
    Environment  = "${var.environment}"
    Project      = "${local.project_name}"
    Region       = var.location
    Subscription = data.azurerm_subscription.current.display_name
  }

}