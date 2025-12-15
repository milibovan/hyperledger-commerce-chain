# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker's cache
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# --- Runtime Stage ---
# Use a minimal base image like 'scratch' for the smallest possible image
FROM scratch

# Optional: If your application needs SSL certificates (e.g., for outgoing HTTPS requests), copy them.
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/server .

# Expose the port your application listens on
EXPOSE 8080

# Run the application
CMD ["./server"]
