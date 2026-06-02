terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = "2.61.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.1.0"
    }
  }
}

provider "confluent" {
  cloud_api_key    = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret
}

provider "azurerm" {
  features {

  }
}