#!/bin/bash
avrogen -pkg models -o ~/pidasp/hyperledger-commerce-chain/go/src/github.com/milibovan/application/models/notification_event.go ~/pidasp/hyperledger-commerce-chain/schemas/notification-event.avsc
struct-from-avro ~/pidasp/hyperledger-commerce-chain/schemas/notification-event.avsc > ~/pidasp/hyperledger-commerce-chain/email-service/email-service/src/notification_event.rs