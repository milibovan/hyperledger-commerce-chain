resource "confluent_environment" "dev" {
  display_name = "dev"

  stream_governance {
    package = "ESSENTIALS"
  }
}

resource "confluent_flink_compute_pool" "main" {
  display_name = "standard_compute_pool"
  cloud        = "AZURE"
  region       = "eastus"
  max_cfu      = 5
  environment {
    id = confluent_environment.development.id
  }
}

module "base" {
  source = "../../modules/confluent-base"
  env_id = confluent_environment.dev.id
}

module "topics" {
  source = "../../modules/confluent-topics"
}

module "schemas" {
  source = "../../modules/confluent-schemas"
  sr_endpoint = module.base.sr_endpoint
  sr_id = module.base.sr_id
}