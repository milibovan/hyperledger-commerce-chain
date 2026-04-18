FROM rust:latest AS builder
WORKDIR /app

# Copy the source code and build
COPY . .
RUN cargo build --release

# Stage 2: Run the application
FROM rust:latest
WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/target/release/stream-generator .

# Expose the port your application listens on (e.g., 8080)
EXPOSE 6666

# Command to run the application
CMD ["./stream-generator"]