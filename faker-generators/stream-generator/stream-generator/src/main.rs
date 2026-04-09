use std::process::Command;

fn main() {
    let output = Command::new("node")
        .arg("../generate_stream_data.mjs")
        .output()
        .expect("Failed to run Node.js");

    println!("JS Output: {}", String::from_utf8_lossy(&output.stdout));
}
