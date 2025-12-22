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

# Install runtime dependencies for Kafka
RUN apk --no-cache add ca-certificates tzdata librdkafka

# Create a non-root user for security
RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/server .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the port your application listens on
EXPOSE 7070

# Health check (adjust the endpoint as needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7070/health || exit 1

# Run the application
CMD ["./server"]