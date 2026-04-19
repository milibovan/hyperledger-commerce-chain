use rdkafka::config::ClientConfig;
use rdkafka::producer::{BaseProducer, BaseRecord, Producer};
use reqwest::Client;
use std::env;
use std::time::Duration;

pub async fn produce_events(
    header_schema_str: String,
    schema_str: String,
    avro_bytes: Vec<u8>,
    key: String,
) -> Result<(), Box<dyn std::error::Error>> {
    let brokers = env::var("KAFKA_BROKERS")
        .unwrap_or("localhost:9092,localhost:9094,localhost:9096".to_string());
    let schema_registry =
        env::var("SCHEMA_REGISTRY_URL").unwrap_or("http://localhost:8081".to_string());

    let schema_id =
        ensure_schema_registered(&schema_registry, &header_schema_str, &schema_str)
            .await?;

    let payload = build_wire_format(schema_id, &avro_bytes);

    let producer: BaseProducer = ClientConfig::new()
        .set("bootstrap.servers", &brokers)
        .create()?;

    let schema: serde_json::Value = serde_json::from_str(&schema_str)?;
    let namespace = schema["namespace"].as_str().unwrap();
    
    let topic = namespace.split('.').last().unwrap().to_string();
    let record = BaseRecord::to(&topic).payload(&payload).key(&key);


    match producer.send(record) {
        Ok(_) => println!("Sent record"),
        Err(err) => println!("Sent error: {:?}", err),
    }

    for _ in 0..10 {
        producer.poll(Duration::from_millis(100));
    }

    producer.flush(Duration::from_secs(1)).expect("Failed to flush messages");

    Ok(())
}

async fn ensure_schema_registered(
    sr_url: &str,
    header_schema_str: &str,
    schema_str: &str,
) -> Result<u32, Box<dyn std::error::Error>> {
    let client = Client::new();

    let header_schema: serde_json::Value = serde_json::from_str(header_schema_str)?;
    let header_subject = format!(
        "{}", header_schema["name"].as_str().unwrap()
    );
    let header_url = format!("{}/subjects/{}/versions", sr_url, header_subject);

    let header_body = serde_json::json!({
        "schema": header_schema_str,
        "schemaType": "AVRO"
    });

    let header_res = client
        .post(&header_url)
        .header("Content-Type", "application/vnd.schemaregistry.v1+json")
        .json(&header_body)
        .send()
        .await?;

    let header_json: serde_json::Value = header_res.json().await?;
    if let Some(err) = header_json.get("error_code") {
        return Err(format!(
            "Header schema registration error: {} - {}",
            err, header_json["message"]
        )
        .into());
    }

    let header_version_url = format!("{}/subjects/{}/versions/latest", sr_url, header_subject);
    let header_version_res = client.get(&header_version_url).send().await?;
    let header_version_json: serde_json::Value = header_version_res.json().await?;
    let header_version = header_version_json["version"].as_u64().unwrap();

    let schema: serde_json::Value = serde_json::from_str(schema_str)?;
    let subject = format!(
        "{}", schema["name"].as_str().unwrap()
    );

    let event_url = format!("{}/subjects/{}/versions", sr_url, subject);

    let body = serde_json::json!({
        "schema": schema_str,
        "schemaType": "AVRO",
        "references": [
            {
                "name": &header_subject,
                "subject": &header_subject,
                "version": header_version
            }
        ]
    });

    let res = client
        .post(&event_url)
        .header("Content-Type", "application/vnd.schemaregistry.v1+json")
        .json(&body)
        .send()
        .await?;

    let json: serde_json::Value = res.json().await?;

    if let Some(err) = json.get("error_code") {
        return Err(format!("Schema Registry error: {} - {}", err, json["message"]).into());
    }

    let schema_id = json["id"].as_u64().unwrap() as u32;

    Ok(schema_id)
}

fn build_wire_format(schema_id: u32, avro_bytes: &[u8]) -> Vec<u8> {
    let mut buf = Vec::with_capacity(5 + avro_bytes.len());
    buf.push(0x00);
    buf.extend_from_slice(&schema_id.to_be_bytes());
    buf.extend_from_slice(avro_bytes);
    buf
}
