// kafka.rs
use rdkafka::consumer::{Consumer, StreamConsumer, CommitMode};
use rdkafka::config::ClientConfig;
use rdkafka::message::Message;
use std::env;
use schema_registry_converter::async_impl::schema_registry::SrSettings;
use schema_registry_converter::async_impl::avro::AvroDecoder;
use crate::notification_event::NotificationEvent;
use crate::sender::send_email; // Import your sender here
use apache_avro::from_value;

pub(crate) async fn start_consumer() {
    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092,localhost:9094,localhost:9096".to_string());
    let schema_registry = env::var("SCHEMA_REGISTRY_URL").unwrap_or("http://localhost:8081".to_string());

    let decoder = AvroDecoder::new(SrSettings::new(schema_registry));
    let topic = "notifications";
    let group_id = "email-service-consumer-group";

    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("auto.offset.reset", "earliest")
        .set("enable.auto.commit", "false")
        .create()
        .expect("Consumer creation failed");

    consumer.subscribe(&[topic]).expect("Can't subscribe to the specified topic");

    println!("Starting consumer loop for topic: {}", topic);

    // This loop now runs forever
    loop {
        match consumer.recv().await {
            Ok(message) => {
                let payload = match message.payload() {
                    Some(p) => p,
                    None => continue, // Skip empty messages
                };

                // Decode Avro
                match decoder.decode(Some(payload)).await {
                    Ok(avro_result) => {
                        match from_value::<NotificationEvent>(&avro_result.value) {
                            Ok(event) => {
                                println!("✅ Event received: {:?}", event.id);
                                
                                tokio::spawn(async move {
                                    send_email(event).await;
                                });
                            }
                            Err(e) => eprintln!("❌ Struct mismatch: {}", e),
                        }
                    }
                    Err(e) => eprintln!("❌ Registry decode error: {}", e),
                }

                if let Err(e) = consumer.commit_message(&message, CommitMode::Async) {
                    eprintln!("Failed to commit offset: {}", e);
                }
            }
            Err(e) => eprintln!("Kafka error: {}", e),
        }
    }
}