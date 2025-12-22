package kafka

import (
	//"bytes"
	"commerce-sdk/models"
	"log"
	//"os"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/confluentinc/confluent-kafka-go/v2/schemaregistry"
	"github.com/confluentinc/confluent-kafka-go/v2/schemaregistry/serde"
	"github.com/confluentinc/confluent-kafka-go/v2/schemaregistry/serde/avro"
)

var (
	producer   *kafka.Producer
	serializer *avro.GenericSerializer
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

	// Init Schema Registry Client
	client, err := schemaregistry.NewClient(schemaregistry.NewConfig(schemaRegistryURL))
	if err != nil {
		log.Fatalf("Failed to create schema registry client: %s", err)
	}

	// Init Serializer
	serializer, err = avro.NewGenericSerializer(client, serde.ValueSerde, avro.NewSerializerConfig())
	if err != nil {
		log.Fatalf("Failed to create serializer: %s", err)
	}
}

func ProduceToKafka(message models.NotificationEvent, topic string) error {

	// Serialize
	payload, err := serializer.Serialize(topic, &message)
	if err != nil {
		return err
	}

	// Produce
	err = producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Value:          payload,
	}, nil)

	return err
}

func CloseKafka() {
	producer.Flush(15 * 1000)
	producer.Close()
	serializer.Close()
}
