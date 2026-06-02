resource "confluent_environment" "development" {
  display_name = "development"
}

resource "confluent_flink_compute_pool" "main" {
  display_name = "standard_compute_pool"
  cloud        = "AZURE"
  region       = "switzerlandnorth"
  max_cfu      = 5
  environment {
    id = confluent_environment.development.id
  }
}