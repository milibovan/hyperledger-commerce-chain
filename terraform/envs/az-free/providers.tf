terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.1.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.0"
    }
    neon = {
      source = "kislerdm/neon"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "2.1.0"
    }
  }
}

provider "vault" {}

data "vault_kv_secret_v2" "neon_secrets" {
  mount = "kv"
  name  = "secrets/neon"
}

provider "neon" {
  api_key = data.vault_kv_secret_v2.neon_secrets.data["NEON_API_KEY"]
}

data "vault_kv_secret_v2" "upstash_secrets" {
  mount = "kv"
  name  = "secrets/upstash"
}

provider "upstash" {
  api_key = data.vault_kv_secret_v2.upstash_secrets.data["api_key"]
  email   = data.vault_kv_secret_v2.upstash_secrets.data["email"]
}

data "vault_kv_secret_v2" "azure_secrets" {
  mount = "kv"
  name  = "secrets/azure"
}

provider "azurerm" {
  features {  }
  subscription_id = data.vault_kv_secret_v2.azure_secrets.data["subscription_id_free"]
}
