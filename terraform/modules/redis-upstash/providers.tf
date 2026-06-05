terraform {
  required_providers {
    upstash = {
      source  = "upstash/upstash"
      version = "2.1.0"
    }
  }
}

data "vault_kv_secret_v2" "upstash_secrets" {
  mount = "kv"
  name  = "secrets/upstash"
}

provider "upstash" {
  api_key = data.vault_kv_secret_v2.upstash_secrets.data["api_key"]
  email   = data.vault_kv_secret_v2.upstash_secrets.data["email"]
}