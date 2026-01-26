use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)] // Don't send password hash in JSON responses
    pub password: String,
    pub full_name: String,
    pub role: String,
    pub unique_id: Uuid,
    pub is_verified: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct VerificationToken {
    pub id: i32,
    pub token: String,
    pub user_id: i32,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct RefreshToken {
    pub id: i32,
    pub token: String,
    pub user_id: i32,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub status: Option<String>,
}

#[derive(Deserialize)]
pub struct RegisterUserDto {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
}