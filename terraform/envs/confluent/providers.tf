terraform {
  required_providers {
    confluent = {
      source  = "confluentinc/confluent"
      version = "2.61.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.0"
    }
  }
}



provider "vault" {

}

data "vault_kv_secret_v2" "confluent_secrets" {
  mount = "kv"
  name  = "secrets/confluent"
}

provider "confluent" {
  cloud_api_key    = var.confluent_cloud_api_key
  cloud_api_secret = var.confluent_cloud_api_secret
}