terraform {
  required_providers {
    neon = {
      source = "kislerdm/neon"
    }
  }
}

data "vault_kv_secret_v2" "neon_secrets" {
  mount = "kv"
  name  = "secrets/neon"
}

provider "neon" {
  api_key = data.vault_kv_secret_v2.neon_secrets.data["NEON_API_KEY"]
}
