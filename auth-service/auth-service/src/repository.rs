use crate::models::{RegisterUserDto, User};
use anyhow::Result;
use sqlx::{PgPool, Pool, Postgres};

pub struct AuthRepository {
    pool: PgPool,
}

impl AuthRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }

    pub async fn save_user(&self, user: RegisterUserDto, hashed_pass: String) -> Result<User, sqlx::Error> {
        sqlx::query_as::<_, User>(
            r#"
        INSERT INTO users (username, email, password, full_name)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#
        )
            .bind(user.username)
            .bind(user.email)
            .bind(hashed_pass)
            .bind(user.full_name)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }
}
