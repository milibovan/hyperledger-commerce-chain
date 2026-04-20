mod kafka;
use kafka::produce_events;
use rand::Rng;
use std::env;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::time::Duration;
use tokio::time::timeout;

#[tokio::main]
async fn main() {
    loop {
        let value = rand::rng().random_range(500..=2000);

        match timeout(Duration::from_millis(value), generate_event()).await {
            Ok(_) => println!("Event generated!"),
            Err(_) => println!("Failed to generate event"),
        }
    }
}

async fn generate_event() {
    let script = env::var("SCRIPT_PATH").unwrap_or("../generate_stream_data.mjs".to_string());

    let mut output = Command::new("node")
        .arg(script)
        .envs(env::vars())
        .stdout(Stdio::piped())
        .spawn()
        .expect("failed to execute node");

    let stdout = output.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    for line in reader.lines() {
        let line = line.expect("Failed to read line from terminal");
        println!("{}", line);
        let payload: serde_json::Value = serde_json::from_str(&line).expect("failed to parse json");

        let header_schema_str = payload["headerSchema"].as_str().unwrap();
        let schema_str = payload["schema"].as_str().unwrap();
        let key = payload["key"].as_str().unwrap();
        let avro_bytes =
            base64::decode(payload["data"].as_str().unwrap()).expect("base64 decode error");

        produce_events(
            header_schema_str.to_string(),
            schema_str.to_string(),
            avro_bytes,
            key.to_string(),
        )
        .await
        .expect("Failed to produce events");
    }
}
