use std::env;
use std::time::Duration;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{BaseProducer, BaseRecord, Producer};
use schema_registry_converter::async_impl::avro::{AvroEncoder};
use schema_registry_converter::async_impl::schema_registry::SrSettings;

pub fn produce_events() {
    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092,localhost:9094,localhost:9096".to_string());
    let schema_registry = env::var("SCHEMA_REGISTRY_URL").unwrap_or("http://localhost:8081".to_string());

    let encoder = AvroEncoder::new(SrSettings::new(schema_registry));

    let producer: BaseProducer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .create()
        .expect("Consumer creation failed");

    let record = BaseRecord::to("test-topic")
        .payload("Hello World")
        .key("1234567890");

    match producer.send(record) {
        Ok(_) => println!("Sent record"),
        Err(err) => println!("Sent error: {:?}", err),
    }

    for _ in 0..10 {
        producer.poll(Duration::from_millis(100));
    }

    producer.flush(Duration::from_secs(1)).expect("Failed to flush messages");
}