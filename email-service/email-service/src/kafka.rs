use rdkafka::consumer::{Consumer, StreamConsumer, CommitMode};
use rdkafka::config::ClientConfig;
use rdkafka::message::Message;
use std::env;
use schema_registry_converter::async_impl::schema_registry::SrSettings;
use schema_registry_converter::async_impl::avro::AvroDecoder;
use crate::notification_event::NotificationEvent;
use apache_avro::from_value;

pub(crate) async fn consume_messages() -> NotificationEvent {
    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092,localhost:9094,localhost:9096".to_string());
    let schema_registry = env::var("SCHEMA_REGISTRY_URL").unwrap_or("http://localhost:8081".to_string());
    let decoder = AvroDecoder::new(SrSettings::new(schema_registry));
    let topic = "notifications";
    let group_id = "email-service-consumer-group";

    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000") // Best practice for higher availability
        .set("auto.offset.reset", "earliest") // Start consuming from the beginning if no offset is committed
        // Disable auto-commit to ensure at-least-once processing,
        // then manually commit after processing each message
        .set("enable.auto.commit", "false")
        .create()
        .expect("Consumer creation failed");

    // Subscribe to the topic(s)
    consumer.subscribe(&[topic]).expect("Can't subscribe to the specified topic");

    println!("Starting consumer loop for topic: {}", topic);

    loop {
        match consumer.recv().await {
            Ok(message) => {
                if let Some(payload) = message.payload() {
                    match decoder.decode(Some(payload)).await {
                        Ok(avro_result) => {
                            let result = from_value::<NotificationEvent>(&avro_result.value);

                            match result {
                                Ok(event) => {
                                    println!("✅ Successfully deserialized event: {:?}", event.id);
                                    println!("Type: {:?}, Channel: {:?}", event.event_type, event.channel);
                                    return event;
                                }
                                Err(e) => {
                                    eprintln!("❌ Data matches Avro schema, but not Rust struct: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ Failed to decode from Registry (Network/Schema Error): {}", e);
                        }
                    }
                }
                consumer.commit_message(&message, CommitMode::Async).unwrap();
            }
            Err(e) => eprintln!("Kafka error: {}", e),
        }
    }
}