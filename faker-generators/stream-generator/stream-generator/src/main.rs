mod kafka;

use std::process::Command;
use std::env;
use crate::kafka::produce_events;

fn main() {
    // let output = Command::new("node")
    //     .arg("../generate_stream_data.mjs")
    //     .envs(env::vars()) 
    //     .output()
    //     .expect("Failed to run Node.js");
    // 
    // println!("Exit status: {}", output.status);
    // println!("JS stdout: {}", String::from_utf8_lossy(&output.stdout));
    // eprintln!("JS stderr: {}", String::from_utf8_lossy(&output.stderr));

    produce_events();
}
