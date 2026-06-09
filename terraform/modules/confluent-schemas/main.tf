locals {
  schema_base_dir = "${path.module}/../../../schemas/streams-schemas"

  header_schema_path = "${local.schema_base_dir}/schema-header.avsc"

  avro_file_paths = fileset(local.schema_base_dir, "*/*.avsc")

  schemas_to_register = {
    for path_string in local.avro_file_paths : path_string => {
      absolute_path = "${local.schema_base_dir}/${path_string}"
      event_name    = trimsuffix(basename(path_string), ".avsc")
      domain        = split("/", path_string)[0]
    }
  }
}

resource "confluent_schema" "header_schema" {
  schema_registry_cluster {
    id = var.sr_id
  }
  rest_endpoint = var.sr_endpoint

  credentials {
    key    = var.sr_api_key
    secret = var.sr_api_secret
  }

  format       = "AVRO"
  schema       = file(local.header_schema_path)
  subject_name = "streams-header-value"
}

resource "confluent_schema" "app_schemas" {
  for_each = local.schemas_to_register

  schema_registry_cluster {
    id = var.sr_id
  }
  rest_endpoint = var.sr_endpoint

  credentials {
    key    = var.sr_api_key
    secret = var.sr_api_secret
  }

  format = "AVRO"
  schema = file(each.value.absolute_path)

  subject_name = "${each.value.event_name}-value"

  schema_reference {
    name         = "com.hyperledger_commerce_chain.streams.StreamsHeader"
    subject_name = confluent_schema.header_schema.subject_name
    version      = confluent_schema.header_schema.version
  }

  depends_on = [confluent_schema.header_schema]
}
