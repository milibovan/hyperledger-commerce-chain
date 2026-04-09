import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import fs from "fs";
import avsc from "avsc";

const headerSchema = JSON.parse(fs.readFileSync("../../schemas/streams-schemas/schema-header.avsc", "utf8"));
const userCreatedSchema   = JSON.parse(fs.readFileSync("../../schemas/streams-schemas/user/user-created.avsc", "utf8"));
const userDeletedSchema   = JSON.parse(fs.readFileSync("../../schemas/streams-schemas/user/user-deleted.avsc", "utf8"));

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

const createUser = () => {
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

const deleteUser = () => {
    const header = genHeader(EventTypes.UserDeleted, EntityTypes.User)

    const userDeletedEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }

    // pools.userIds.push(id);
    // pools.userOrders[id] = [];
    // pools.userRequests[id] = [];
    
    return userDeletedEvent
}

const registry = {};

avsc.Type.forSchema(headerSchema, { registry });
const UserCreatedEvent = avsc.Type.forSchema(userCreatedSchema, { registry });
const UserDeletedEvent = avsc.Type.forSchema(userDeletedSchema, { registry });

const userCreatedEvent = createUser()
const userDeletedEvent = deleteUser()
console.log(userCreatedEvent);
console.log(userDeletedEvent);

const buf = UserCreatedEvent.toBuffer(userCreatedEvent);
const bufDel = UserDeletedEvent.toBuffer(userDeletedEvent);
fs.writeFileSync("userCreatedEvent.avro", buf);
fs.writeFileSync("UserDeletedEvent.avro", bufDel);

const decoded = UserCreatedEvent.fromBuffer(buf);
const decodedDeleted = UserDeletedEvent.fromBuffer(bufDel);
console.log("Decoded:", decoded);
console.log("Decoded:", decodedDeleted);

