
CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    unique_id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS verification_tokens (
   id SERIAL PRIMARY KEY,
   token VARCHAR NOT NULL,
   user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Matched type + Foreign Key
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR DEFAULT 'pending'
    );

CREATE TABLE IF NOT EXISTS refresh_tokens (
                                              id SERIAL PRIMARY KEY,
                                              token VARCHAR NOT NULL,
                                              user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Matched type + Foreign Key
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR DEFAULT 'active'
    );

CREATE INDEX idx_users_email ON users (email);