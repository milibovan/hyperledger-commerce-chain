package kafka

import (
	"commerce-sdk/models"
	"encoding/binary"
	"fmt"
	"log"
	"os"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/hamba/avro/v2"
	"github.com/riferrei/srclient"
)

var (
	producer       *kafka.Producer
	schemaRegistry *srclient.SchemaRegistryClient
)

func InitKafka(bootstrapServers, schemaRegistryURL string) {
	var err error

	// Init Producer
	producer, err = kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers":  bootstrapServers,
		"acks":               "all",
		"enable.idempotence": true,
	})
	if err != nil {
		log.Fatalf("Failed to create producer: %s", err)
	}

	schemaRegistry = srclient.NewSchemaRegistryClient(schemaRegistryURL)
}

func ProduceToKafka(message models.NotificationEvent, topic string) error {
	schema, err := schemaRegistry.GetLatestSchema(topic)
	if schema == nil {
		path := os.Getenv("SCHEMA_PATH")

		if path == "" {
			path = "../../../../../../schemas/notification-event.avsc"
		}

		schemaBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read schema file at %s: %w", path, err)
		}
		schema, err = schemaRegistry.CreateSchema(topic, string(schemaBytes), srclient.Avro)
		if err != nil {
			panic(fmt.Sprintf("Error creating the schema %s", err))
		}
	}

	hambaSchema, err := avro.Parse(schema.Schema())
	if err != nil {
		return fmt.Errorf("failed to parse schema string: %w", err)
	}

	valueBytes, err := avro.Marshal(hambaSchema, message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	schemaIDBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(schemaIDBytes, uint32(schema.ID()))

	var recordValue []byte
	recordValue = append(recordValue, byte(0))
	recordValue = append(recordValue, schemaIDBytes...)
	recordValue = append(recordValue, valueBytes...)

	// Produce
	err = producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Value:          recordValue,
	}, nil)

	return err
}

func CloseKafka() {
	producer.Flush(15 * 1000)
	producer.Close()
}
