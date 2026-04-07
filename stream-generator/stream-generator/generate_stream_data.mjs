import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import fs from "fs";
import avsc from "avsc";

const headerSchema = JSON.parse(fs.readFileSync("../../schemas/streams-schemas/schema-header.avsc", "utf8"));
const userSchema   = JSON.parse(fs.readFileSync("../../schemas/streams-schemas/user/user-created.avsc", "utf8"));

const EventTypes = Object.freeze({
  UserCreated: "UserCreated",
  UserDeleted: "UserDeleted",
  TraderCreated: "TraderCreated",
  TraderDeleted: "TraderDeleted",
  ProductCreated: "ProductCreated",
  ProductDeleted: "ProductDeleted",
  OrderCreated: "OrderCreated",
  OrderCompleted: "OrderCompleted",
  OrderFulfilled: "OrderFulfilled",
  OrderApproved: "OrderApproved",
  OrderCancelled: "OrderCancelled",
  ReceiptCreated: "ReceiptCreated",
  ReceiptCancelled: "ReceiptCancelled",
  RequestCreated: "RequestCreated",
  RequestPending: "RequestPending",
  RequestApproved: "RequestApproved",
  RequestRejected: "RequestRejected",
  RequestFulfilled: "RequestFulfilled",
  RequestExpired: "RequestExpired",
  RequestCancelled: "RequestCancelled"
});

const EntityTypes = Object.freeze({
  User: "User",
  Trader: "Trader",
  Product: "Product",
  Order: "Order",
  Receipt: "Receipt",
  Request: "Request"
});


const genHeader = (event_type, entity_type) => {
    const event_id = faker.string.uuid();
    const entity_id = faker.string.uuid();
    const timestamp = Date.now();
    const correlation_id = faker.string.uuid();
    const causation_id = faker.string.uuid();

    const header = {
        event_id,
        event_type,
        entity_id,
        entity_type,
        timestamp,
        correlation_id,
        causation_id
    }

    return header;
}

const genUser = () => {
    const header = genHeader(EventTypes.UserCreated, EntityTypes.User)
    
    const userCreatedEvent = {
        "common": header,
        "name": faker.person.firstName(),
        "surname": faker.person.lastName(),
        "email": faker.internet.email(),
        "balance": parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),
    }

    // pools.userIds.push(id);
    // pools.userOrders[id] = [];
    // pools.userRequests[id] = [];
    
    return userCreatedEvent
};
const registry = {};

avsc.Type.forSchema(headerSchema, { registry });
const UserCreatedEvent = avsc.Type.forSchema(userSchema, { registry });

const userCreatedEvent = genUser()
console.log(userCreatedEvent);

const buf = UserCreatedEvent.toBuffer(userCreatedEvent);
fs.writeFileSync("userCreatedEvent.avro", buf);

const decoded = UserCreatedEvent.fromBuffer(buf);
console.log("Decoded:", decoded);

