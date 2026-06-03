terraform {
  required_providers {
    # confluent = {
    #   source  = "confluentinc/confluent"
    #   version = "2.61.0"
    # }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.1.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.0"
    }
  }
}

# provider "confluent" {
#   cloud_api_key    = var.confluent_cloud_api_key
#   cloud_api_secret = var.confluent_cloud_api_secret
# }

provider "vault" {

}

data "vault_kv_secret_v2" "azure_secrets" {
  mount = "kv"
  name  = "secrets/azure"
}

provider "azurerm" {
  features {

  }
  subscription_id = data.vault_kv_secret_v2.azure_secrets.data["subscription_id"]
}