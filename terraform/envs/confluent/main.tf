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
    id = confluent_environment.dev.id
  }
}

module "base" {
  source        = "../../modules/confluent-base"
  env_id        = confluent_environment.dev.id
  resource_name = confluent_environment.dev.resource_name
}

module "topics" {
  source              = "../../modules/confluent-topics"
  kafka_cluster_id    = module.base.kafka_cluster_id
  kafka_rest_endpoint = module.base.kafka_rest_endpoint
  kafka_api_key       = module.base.kafka_api_key
  kafka_api_secret    = module.base.kafka_api_secret
}

module "schemas" {
  source        = "../../modules/confluent-schemas"
  sr_endpoint   = module.base.sr_endpoint
  sr_id         = module.base.sr_id
  sr_api_key    = module.base.sr_api_key
  sr_api_secret = module.base.sr_api_secret
}
