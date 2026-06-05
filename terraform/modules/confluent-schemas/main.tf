locals {
  schema_base_dir = "${path.module}/../../schemas/streams-schemas"

  avro_file_paths = fileset(local.schema_base_dir, "*/*.avsc")

  schemas_to_register = {
    for path_string in local.avro_file_paths : path_string => {
      absolute_path = "${local.schema_base_dir}/${path_string}"
      event_name    = trimsuffix(basename(path_string), ".avsc")
      domain        = split("/", path_string)[0]
    }
  }
}

resource "confluent_schema" "app_schemas" {
  for_each = local.schemas_to_register

  schema_registry_cluster {
    id = var.sr_id
  }
  rest_endpoint = var.sr_endpoint
  
  format = "AVRO"
  
  schema = file(each.value.absolute_path)

  subject_name = "${each.value.event_name}"
}