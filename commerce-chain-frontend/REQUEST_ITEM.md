# Trading System Implementation Checklist

## Phase 1: Infrastructure Setup

### 1.1 Kafka & Schema Registry
- [ ] Create `docker-compose.yml` with Kafka, Schema Registry
- [ ] Add Schema Registry UI (optional but helpful)
- [ ] Start services: `docker-compose up -d`
- [ ] Verify Kafka: `docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092`
- [ ] Verify Schema Registry: `curl http://localhost:8081/subjects`
- [ ] Create `notifications` topic with 12 partitions
```bash
  docker exec -it kafka kafka-topics --create \
    --topic notifications \
    --partitions 12 \
    --replication-factor 1 \
    --bootstrap-server localhost:9092
```

### 1.2 Project Structure
- [ ] Create schema directory structure:
```
  project/
  ├── schemas/
  │   ├── notification-event.avsc
  │   └── README.md
  ├── go-backend/
  ├── rust-middleware/
  ├── rust-email-service/
  └── docker-compose.yml
```

---

## Phase 2: Schema Definition & Registration

### 2.1 Define Avro Schema
- [ ] Create `schemas/notification-event.avsc` with all event types
- [ ] Define event types enum (ORDER_INSUFFICIENT_BALANCE, etc.)
- [ ] Define channel enum (EMAIL, SMS, PUSH, IN_APP)
- [ ] Define priority enum (LOW, NORMAL, HIGH, URGENT)
- [ ] Add metadata fields for tracking
- [ ] Document each field with descriptions

### 2.2 Register Schema
- [ ] Create script `scripts/register-schema.sh`:
```bash
  #!/bin/bash
  curl -X POST http://localhost:8081/subjects/notifications-value/versions \
    -H "Content-Type: application/vnd.schemaregistry.v1+json" \
    -d "{\"schema\": $(cat schemas/notification-event.avsc | jq -Rs .)}"
```
- [ ] Make script executable: `chmod +x scripts/register-schema.sh`
- [ ] Run script and verify: `./scripts/register-schema.sh`
- [ ] Verify registration: `curl http://localhost:8081/subjects/notifications-value/versions`
- [ ] Set compatibility mode to BACKWARD:
```bash
  curl -X PUT http://localhost:8081/config/notifications-value \
    -H "Content-Type: application/json" \
    -d '{"compatibility": "BACKWARD"}'
```

### 2.3 Code Generation Setup
- [ ] Install Go code generator: `go install github.com/hamba/avro/v2/cmd/avrogen@latest`
- [ ] Create `scripts/generate-go-code.sh`:
```bash
  #!/bin/bash
  avrogen -pkg models -o go-backend/models/notification_event.go schemas/notification-event.avsc
```
- [ ] For Rust: Install `apache-avro` CLI or use manual struct definition
- [ ] Add code generation to Makefile/build scripts
- [ ] Run generation and verify files created

---

## Phase 3: Go Backend (Producer) Implementation

### 3.1 Update Dependencies
- [ ] Add to `go.mod`:
```
  github.com/confluentinc/confluent-kafka-go/v2 v2.3.0
  github.com/hamba/avro/v2 v2.15.0
  github.com/google/uuid v1.5.0
```
- [ ] Run `go mod tidy`

### 3.2 Create Notification Producer
- [ ] Create `internal/kafka/notification_producer.go`
- [ ] Implement `NotificationProducer` struct with:
    - Kafka producer client
    - Avro serializer with Schema Registry client
- [ ] Implement `NewNotificationProducer(brokers, schemaRegistryURL string)` constructor
- [ ] Implement `PublishNotification(event *NotificationEvent)` method
- [ ] Add configuration for Kafka brokers and Schema Registry URL
- [ ] Add error handling and logging

### 3.3 Integrate with Order Service
- [ ] Update `Order` model with new status: `OrderPendingPayment`
- [ ] Add `BalanceShortfall` field to Order model
- [ ] Update `CreateOrder` logic:
    - [ ] Check user balance vs order total
    - [ ] Set appropriate order status
    - [ ] Calculate shortfall if insufficient
- [ ] Inject `NotificationProducer` into `OrderService`
- [ ] Add notification publishing after order creation:
    - [ ] For `PENDING_PAYMENT`: publish insufficient balance event
    - [ ] For payment completed: publish payment confirmation event
    - [ ] For order approved: publish approval event
    - [ ] For order fulfilled: publish fulfillment event
- [ ] Use `user_id` as partition key for ordering guarantees
- [ ] Add async/fire-and-forget pattern (don't block on notification failure)

### 3.4 Add Other Event Triggers
- [ ] In `UpdateOrderStatus`: publish status change events
- [ ] In `ProcessPayment`: publish payment completed event
- [ ] In `CancelOrder`: publish cancellation event
- [ ] Create helper method `createNotificationEvent()` to reduce duplication

### 3.5 Configuration
- [ ] Add to config file (YAML/ENV):
```yaml
  kafka:
    brokers: "localhost:9092"
    topic: "notifications"
  schema_registry:
    url: "http://localhost:8081"
```
- [ ] Load config in application startup
- [ ] Initialize NotificationProducer as singleton/dependency

---

## Phase 4: Update Data Models

### 4.1 Order Model Enhancements
- [ ] Add new statuses:
```go
  OrderPendingPayment   OrderStatus = "PENDING_PAYMENT"
  OrderPendingApproval  OrderStatus = "PENDING_APPROVAL"
  OrderExpired          OrderStatus = "EXPIRED"
  OrderPartiallyFulfilled OrderStatus = "PARTIALLY_FULFILLED"
```
- [ ] Add new fields:
```go
  LockedTotalCost      float64 `json:"locked-total-cost"`
  ReservationType      string  `json:"reservation-type"` // "SOFT" or "HARD"
  ReservationExpiry    string  `json:"reservation-expiry,omitempty"`
  BalanceShortfall     float64 `json:"balance-shortfall,omitempty"`
  PaymentCompletedDate string  `json:"payment-completed-date,omitempty"`
  RejectionReason      string  `json:"rejection-reason,omitempty"`
  RefundAmount         float64 `json:"refund-amount,omitempty"`
```

### 4.2 Product Inventory Enhancement
- [ ] Update `ProductInventory` in Trader:
```go
  type ProductInventory struct {
      ProductId        string `json:"product-id"`
      Quantity         int32  `json:"quantity"`
      AvailableQty     int32  `json:"available-qty"`
      SoftReservedQty  int32  `json:"soft-reserved-qty"`
      HardReservedQty  int32  `json:"hard-reserved-qty"`
  }
```
- [ ] Update inventory logic to track reservations

### 4.3 Database Migration
- [ ] Create migration scripts for new fields
- [ ] Test migrations on dev environment
- [ ] Add rollback scripts
- [ ] Document schema changes

---

## Phase 5: Rust Email Service Implementation

### 5.1 Project Setup
- [ ] Create new Rust project: `cargo new rust-email-service`
- [ ] Add dependencies to `Cargo.toml`:
```toml
  [dependencies]
  rdkafka = { version = "0.36", features = ["cmake-build"] }
  apache-avro = "0.16"
  schema_registry_converter = { version = "4.0", features = ["avro"] }
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
  tokio = { version = "1", features = ["full"] }
  lettre = "0.11"  # Email sending
  tera = "1.19"     # Template engine
  tracing = "0.1"
  tracing-subscriber = "0.3"
  config = "0.14"
  anyhow = "1.0"
```

### 5.2 Configuration
- [ ] Create `config/default.toml`:
```toml
  [kafka]
  brokers = "localhost:9092"
  group_id = "email-service"
  topic = "notifications"
  
  [schema_registry]
  url = "http://localhost:8081"
  
  [email]
  smtp_host = "smtp.gmail.com"
  smtp_port = 587
  from_address = "noreply@tradingsystem.com"
  templates_dir = "templates/"
```
- [ ] Create config loader module

### 5.3 Define Event Struct
- [ ] Create `src/models/notification_event.rs`
- [ ] Define `NotificationEvent` struct matching Avro schema:
```rust
  #[derive(Debug, Deserialize)]
  struct NotificationEvent {
      event_id: String,
      event_type: String,
      timestamp: i64,
      user_id: String,
      channels: Vec<String>,
      priority: String,
      data: HashMap<String, String>,
  }
```

### 5.4 Implement Kafka Consumer
- [ ] Create `src/kafka/consumer.rs`
- [ ] Implement `KafkaConsumer` struct with:
    - StreamConsumer from rdkafka
    - AvroDecoder from schema_registry_converter
- [ ] Implement `new()` constructor
- [ ] Implement `subscribe()` to notifications topic
- [ ] Implement message consumption loop with:
    - Schema validation via AvroDecoder
    - Deserialization to NotificationEvent
    - Error handling for invalid schemas
    - Manual offset commit after successful processing

### 5.5 Implement Email Templates
- [ ] Create `templates/` directory
- [ ] Create email templates:
    - [ ] `insufficient_balance.html` - Order created, need more funds
    - [ ] `payment_completed.html` - Balance topped up
    - [ ] `order_approved.html` - Trader approved order
    - [ ] `order_fulfilled.html` - Order completed
    - [ ] `order_cancelled.html` - Order cancelled
    - [ ] `order_rejected.html` - Trader rejected order
- [ ] Use Tera template syntax with variables: `{{ user_name }}`, `{{ order_id }}`, etc.
- [ ] Create text-only versions for each template
- [ ] Add CSS styling for HTML emails

### 5.6 Implement Email Sender
- [ ] Create `src/email/sender.rs`
- [ ] Implement `EmailSender` struct with Lettre SMTP transport
- [ ] Implement template rendering with Tera
- [ ] Implement `send_email(to, template_name, data)` method
- [ ] Add retry logic (3 attempts with exponential backoff)
- [ ] Add email delivery logging
- [ ] Handle SMTP errors gracefully

### 5.7 Implement Email Service
- [ ] Create `src/service/email_service.rs`
- [ ] Implement `EmailService` struct combining:
    - KafkaConsumer
    - EmailSender
    - User repository (to fetch user email)
- [ ] Implement `run()` main loop:
    - [ ] Consume Kafka messages
    - [ ] Filter by channel (only process if "EMAIL" in channels)
    - [ ] Route by event_type to appropriate template
    - [ ] Fetch user email from database/API
    - [ ] Render and send email
    - [ ] Commit Kafka offset
    - [ ] Handle errors and log to DLQ
- [ ] Implement graceful shutdown on SIGTERM

### 5.8 User Email Lookup
- [ ] Decide on approach:
    - Option A: Query Go backend API
    - Option B: Direct database access
    - Option C: Cache user data in Rust service
- [ ] Implement chosen approach
- [ ] Add caching if using API calls
- [ ] Handle user not found gracefully

### 5.9 Dead Letter Queue (DLQ)
- [ ] Create DLQ topic: `notifications-dlq`
- [ ] Implement DLQ producer in Rust service
- [ ] Send failed messages to DLQ after max retries
- [ ] Include error details in DLQ message
- [ ] Create monitoring/alerting for DLQ

### 5.10 Main Application
- [ ] Create `src/main.rs`
- [ ] Initialize tracing/logging
- [ ] Load configuration
- [ ] Create EmailService
- [ ] Start service with graceful shutdown
- [ ] Add health check endpoint (optional HTTP server on :8080/health)

---

## Phase 6: Rust Middleware (Separate from Email Service)

### 6.1 Project Setup
- [ ] Create new Rust project: `cargo new rust-middleware`
- [ ] Add dependencies:
```toml
  [dependencies]
  axum = "0.7"
  tokio = { version = "1", features = ["full"] }
  tower = "0.4"
  tower-http = { version = "0.5", features = ["cors", "trace"] }
  jsonwebtoken = "9.2"
  serde = { version = "1.0", features = ["derive"] }
  tracing = "0.1"
  tracing-subscriber = "0.3"
  reqwest = "0.11"
```

### 6.2 Implement API Gateway
- [ ] Create `src/gateway/mod.rs`
- [ ] Implement reverse proxy to Go backend
- [ ] Add request routing logic
- [ ] Add request/response logging

### 6.3 Authentication & Authorization
- [ ] Create `src/auth/mod.rs`
- [ ] Implement JWT validation middleware
- [ ] Implement token refresh logic
- [ ] Add role-based access control
- [ ] Integrate with Go backend for user verification

### 6.4 Security Features
- [ ] Add rate limiting middleware
- [ ] Add request validation
- [ ] Add CORS configuration
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Add request size limits
- [ ] Add timeout configuration

### 6.5 Main Application
- [ ] Set up Axum router
- [ ] Apply middleware layers
- [ ] Configure TLS (for production)
- [ ] Add health check endpoint
- [ ] Add metrics endpoint (Prometheus)

---

## Phase 7: Order Lifecycle & Reservation Logic

### 7.1 Implement Soft Reservation
- [ ] When order created with `PENDING_PAYMENT`:
    - [ ] Mark products as soft reserved in trader inventory
    - [ ] Set `ReservationType = "SOFT"`
    - [ ] Calculate `ReservationExpiry` (24-48 hours)
    - [ ] Store locked prices in order
- [ ] Create background job to check expired soft reservations
- [ ] Auto-cancel or transition expired orders

### 7.2 Implement Hard Reservation
- [ ] When user balance becomes sufficient:
    - [ ] Transition order to `PENDING_APPROVAL`
    - [ ] Upgrade soft reservation to hard reservation
    - [ ] Set `ReservationType = "HARD"`
    - [ ] Deduct from trader's `AvailableQty`
    - [ ] Send notification to user (payment completed)
    - [ ] Send notification to trader (new order pending)

### 7.3 Balance Check Service
- [ ] Create background job/cron:
    - [ ] Query all `PENDING_PAYMENT` orders
    - [ ] Check if user balance now sufficient
    - [ ] Transition orders automatically
    - [ ] Publish payment completed events
- [ ] Run every 5 minutes (configurable)

### 7.4 Handle Product Unavailability
- [ ] When product becomes unavailable during soft reservation:
    - [ ] Notify user immediately
    - [ ] Offer options: wait, partial order, cancel
    - [ ] Update order status accordingly
- [ ] When product unavailable during hard reservation:
    - [ ] Auto-refund or offer alternatives
    - [ ] Send apology email

### 7.5 Partial Fulfillment
- [ ] Allow traders to partially fulfill orders
- [ ] Create multiple receipts for same order
- [ ] Track fulfillment progress
- [ ] Calculate partial refunds
- [ ] Update order status to `PARTIALLY_FULFILLED`

---

## Phase 8: Testing

### 8.1 Unit Tests
- [ ] Go: Test notification producer serialization
- [ ] Go: Test order state transitions
- [ ] Go: Test balance calculations
- [ ] Rust: Test email template rendering
- [ ] Rust: Test Kafka message deserialization
- [ ] Rust: Test event routing logic

### 8.2 Integration Tests
- [ ] Test Go → Kafka → Rust flow end-to-end
- [ ] Test schema validation (send invalid message)
- [ ] Test email delivery (use test SMTP server like Mailhog)
- [ ] Test order lifecycle:
    - [ ] Create order with insufficient balance
    - [ ] Verify email sent
    - [ ] Add balance
    - [ ] Verify order transitions to PENDING_APPROVAL
    - [ ] Verify second email sent
- [ ] Test DLQ for failed messages

### 8.3 Load Testing
- [ ] Test Kafka throughput (1000+ messages/sec)
- [ ] Test email service capacity
- [ ] Test under high concurrent order creation
- [ ] Monitor Kafka lag
- [ ] Monitor email queue depth

### 8.4 Schema Evolution Testing
- [ ] Add optional field to schema (BACKWARD compatible)
- [ ] Verify old consumers still work
- [ ] Add required field with default (BACKWARD compatible)
- [ ] Test incompatible change (should be rejected)
- [ ] Test rollback scenarios

---

## Phase 9: Monitoring & Observability

### 9.1 Logging
- [ ] Go: Structured logging with logrus/zap
- [ ] Rust: Tracing with tracing-subscriber
- [ ] Centralized logging (ELK/Loki)
- [ ] Log correlation IDs across services

### 9.2 Metrics
- [ ] Kafka producer metrics (messages sent, errors)
- [ ] Kafka consumer metrics (lag, throughput)
- [ ] Email delivery metrics (sent, failed, retries)
- [ ] Order status transition metrics
- [ ] Expose Prometheus endpoints
- [ ] Set up Grafana dashboards

### 9.3 Alerting
- [ ] Alert on Kafka consumer lag > threshold
- [ ] Alert on DLQ message count > threshold
- [ ] Alert on email delivery failures > 5%
- [ ] Alert on Schema Registry unavailability
- [ ] Set up PagerDuty/Opsgenie integration

### 9.4 Distributed Tracing
- [ ] Add OpenTelemetry instrumentation
- [ ] Trace requests across Go → Kafka → Rust
- [ ] Set up Jaeger/Tempo for trace visualization
- [ ] Add trace context propagation

---

## Phase 10: Deployment

### 10.1 Docker Images
- [ ] Create Dockerfile for Go backend
- [ ] Create Dockerfile for Rust middleware
- [ ] Create Dockerfile for Rust email service
- [ ] Optimize images (multi-stage builds)
- [ ] Push to container registry

### 10.2 Orchestration
- [ ] Create Kubernetes manifests or docker-compose for prod
- [ ] Define service dependencies
- [ ] Configure resource limits
- [ ] Set up health checks
- [ ] Configure restart policies

### 10.3 Environment Configuration
- [ ] Create dev environment config
- [ ] Create staging environment config
- [ ] Create production environment config
- [ ] Use secrets management (Vault/K8s Secrets)
- [ ] Never commit secrets to git

### 10.4 CI/CD Pipeline
- [ ] Schema validation in CI
- [ ] Unit tests in CI
- [ ] Integration tests in CI
- [ ] Build Docker images
- [ ] Deploy to staging automatically
- [ ] Manual approval for production
- [ ] Rollback strategy

### 10.5 Production Deployment
- [ ] Deploy Kafka cluster (3+ brokers for HA)
- [ ] Deploy Schema Registry (HA setup)
- [ ] Deploy Go backend (multiple instances)
- [ ] Deploy Rust middleware (load balanced)
- [ ] Deploy Rust email service (multiple workers)
- [ ] Configure monitoring
- [ ] Run smoke tests
- [ ] Monitor for issues

---

## Phase 11: Documentation

### 11.1 Technical Documentation
- [ ] Document Avro schemas with examples
- [ ] Document event types and when they're triggered
- [ ] Document API endpoints
- [ ] Document environment variables
- [ ] Create architecture diagrams
- [ ] Document deployment process

### 11.2 Runbooks
- [ ] How to add new event type
- [ ] How to evolve schema
- [ ] How to handle DLQ messages
- [ ] How to replay Kafka messages
- [ ] Incident response procedures
- [ ] Rollback procedures

### 11.3 Developer Guide
- [ ] Local development setup
- [ ] How to run tests
- [ ] How to debug Kafka issues
- [ ] Code contribution guidelines
- [ ] PR review checklist

---

## Phase 12: Post-Launch

### 12.1 Monitor Production
- [ ] Watch metrics for first 24 hours
- [ ] Monitor Kafka consumer lag
- [ ] Check email delivery rates
- [ ] Verify no messages in DLQ
- [ ] Check error logs

### 12.2 Gather Feedback
- [ ] User feedback on email notifications
- [ ] Timing of notifications (too many? too few?)
- [ ] Email template improvements
- [ ] Performance issues

### 12.3 Iterate
- [ ] Add SMS notifications (reuse same Kafka topic!)
- [ ] Add push notifications
- [ ] Add in-app notifications
- [ ] Improve email templates
- [ ] Add personalization
- [ ] A/B test email content

---

## Quick Start Checklist (Minimum Viable)

If you want to get something working quickly, focus on:

- [ ] ✅ Phase 1: Infrastructure (Kafka + Schema Registry)
- [ ] ✅ Phase 2: Schema Definition
- [ ] ✅ Phase 3.1-3.3: Go Producer (basic)
- [ ] ✅ Phase 4.1: Order Status Updates (minimal)
- [ ] ✅ Phase 5.1-5.7: Rust Email Service (basic)
- [ ] ✅ Phase 8.2: One integration test
- [ ] 🚀 **Deploy and test with real emails**

Then iterate with remaining phases.

---

## Estimated Timeline

- **Phase 1-2** (Infrastructure + Schema): 1-2 days
- **Phase 3-4** (Go Backend): 2-3 days
- **Phase 5** (Rust Email Service): 3-4 days
- **Phase 6** (Rust Middleware): 2-3 days
- **Phase 7** (Business Logic): 2-3 days
- **Phase 8** (Testing): 2-3 days
- **Phase 9-10** (Monitoring + Deployment): 2-3 days
- **Phase 11** (Documentation): 1-2 days

**Total:** 15-23 days (3-5 weeks for one developer)

---

Want me to elaborate on any specific phase or create detailed implementation guides for particular components?