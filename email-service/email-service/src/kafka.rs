use rdkafka::consumer::{Consumer, StreamConsumer, CommitMode};
use rdkafka::config::ClientConfig;
use rdkafka::message::Message;
use std::env;

pub(crate) async fn consume_messages() {
    let brokers = env::var("KAFKA_BROKERS").unwrap_or("localhost:9092,localhost:9094,localhost:9096".to_string());
//     let schema_registry = env::var("SCHEMA_REGISTRY_URL").unwrap_or("http://localhost:8081".to_string());
    let topic = "notifications";         // Replace with your Kafka topic name
    let group_id = "email-service-consumer-group";

    // Create the consumer configuration
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

    // Start the consumption loop
    loop {
        match consumer.recv().await {
            Ok(message) => {
                if let Some(payload) = message.payload_view() {
                    match payload {
                        Ok(payload) => {
                            println!("Received message from partition {} @ offset {}: key={:?}, payload={:?}",
                                     message.partition(),
                                     message.offset(),
                                     message.key(),
                                     std::str::from_utf8(payload).unwrap_or("Invalid UTF-8"),
                            );}
                        Err(_e) => eprint!("Error parsing payload.")
                    }
                    // Commit the offset manually after successful processing
                    consumer.commit_message(&message, CommitMode::Async).unwrap();
                }
            }
            Err(e) => eprintln!("Kafka error: {}", e),
        }
    }
}