use std::env;
use actix_web::{get, App, HttpServer, Responder};

#[get("/")]
async fn index() -> impl Responder {
    "Hello, World!"
}


// TODO Routes
// /login
// /register
// /verify
// Define models and sql scripts
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(index)
    })
        .bind(("127.0.0.1", env::var("PORT").unwrap_or("5050".to_string())))?
        .run()
        .await
}
