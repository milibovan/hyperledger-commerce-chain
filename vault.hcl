storage "file" {
  path = "./vault-data-local"
}

listener "tcp" {
  address     = "0.0.0.0:8202"
  tls_disable = true
}

ui = true