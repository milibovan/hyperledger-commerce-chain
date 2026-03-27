mod models;
mod repository;

use crate::repository::AuthRepository;
use actix_web::{App, HttpServer, Responder, get, web};
use sqlx::postgres::PgPoolOptions;
use std::env;

struct AppState {
    db: AuthRepository,
}

#[get("/")]
async fn index() -> impl Responder {
    "Hello, World!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let auth_repo = AuthRepository::new(pool);

    let app_data = web::Data::new(AppState { db: auth_repo });

    println!("✅ Database connection established!");

    let port = env::var("PORT")
        .unwrap_or_else(|_| "5050".to_string())
        .parse::<u16>()
        .expect("PORT must be a number");

    HttpServer::new(move || App::new().app_data(app_data.clone()).service(index))
        .bind(("0.0.0.0", port))? 
        .run()
        .await
}
