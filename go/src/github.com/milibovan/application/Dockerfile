# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM golang:1.24-alpine AS builder

# Install build dependencies for confluent-kafka-go
RUN apk add --no-cache git gcc g++ libc-dev musl-dev pkgconfig bash make librdkafka-dev

WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker's cache
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy the rest of the source code
COPY . .

# Build the application binary with CGO enabled for Kafka
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 \
    go build -tags musl -ldflags="-w -s" -o /app/server .

# --- Runtime Stage ---
# Use alpine instead of scratch for better compatibility
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata librdkafka

# CHANGE: Use UID 1000 instead of 1001 to match host user
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser

WORKDIR /app

COPY --from=builder /app/server .

# Change ownership inside the container
RUN chown -R appuser:appgroup /app

# Switch to the user
USER appuser

# Expose the port your application listens on
EXPOSE 7070

# Health check (adjust the endpoint as needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7070/api-status || exit 1

# Run the application
CMD ["./server"]