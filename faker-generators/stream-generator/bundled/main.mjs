// generate_stream_data.mjs
import fs2 from "fs";
import avsc from "avsc";

// ../batch-generator/utils.js
import fs from "fs";
import { fakerSR_RS_latin as faker9 } from "@faker-js/faker";

// ../batch-generator/constants.js
import { fakerSR_RS_latin as faker8 } from "@faker-js/faker";

// user_events.js
import { fakerSR_RS_latin as faker2 } from "@faker-js/faker";

// event_header_generator.js
import { fakerSR_RS_latin as faker } from "@faker-js/faker";
var genHeader = (event_type, entity_type, entity_id) => {
  return {
    event_id: faker.string.uuid(),
    event_type,
    entity_type,
    entity_id: entity_id ?? faker.string.uuid(),
    timestamp: Date.now(),
    correlation_id: faker.string.uuid(),
    causation_id: faker.string.uuid()
  };
};

// ../batch-generator/pools.js
import Redis from "ioredis";
import "dotenv/config";
var redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  db: 1,
  password: process.env.REDIS_PASSWORD
});

// user_events.js
var createUser = async () => {
  const header = genHeader(EventTypes.UserCreated, EntityTypes.User);
  await redis.sadd("pool:userIds", header.entity_id);
  const userCreatedEvent = {
    "common": header,
    "name": faker2.person.firstName(),
    "surname": faker2.person.lastName(),
    "email": faker2.internet.email(),
    "balance": parseFloat(faker2.finance.amount({ min: 500, max: 5e4, dec: 2 }))
  };
  return userCreatedEvent;
};
var deleteUser = async () => {
  const userId = await redis.srandmember("pool:userIds");
  if (!userId) throw new Error("No active users available to delete");
  const header = genHeader(EventTypes.UserDeleted, EntityTypes.User, userId);
  await redis.multi().srem("pool:userIds", userId).sadd("pool:userIds:DELETED", userId).exec();
  const userDeletedEvent = {
    "common": header,
    "reason": Math.random() >= 0.5 ? faker2.lorem.lines({ min: 1, max: 3 }) : ""
  };
  return userDeletedEvent;
};

// trader_events.js
import { fakerSR_RS_latin as faker3 } from "@faker-js/faker";
var createTrader = async () => {
  const header = genHeader(EventTypes.TraderCreated, EntityTypes.Trader);
  const traderType = faker3.helpers.arrayElement(TRADER_TYPES);
  await redis.sadd("pool:traderIds", header.event_id);
  const traderCreatedEvent = {
    "common": header,
    "name": faker3.person.firstName(),
    "email": faker3.internet.email(),
    trader_type: traderType,
    "balance": parseFloat(faker3.finance.amount({ min: 500, max: 5e4, dec: 2 })),
    "vat": "VAT-" + faker3.string.alphanumeric(8).toUpperCase()
  };
  return traderCreatedEvent;
};
var deleteTrader = async () => {
  const traderId = await redis.srandmember("pool:traderIds");
  if (!traderId) throw new Error("No active traders available to delete");
  const header = genHeader(EventTypes.TraderDeleted, EntityTypes.Trader, traderId);
  await redis.multi().srem("pool:traderIds", traderId).sadd("pool:traderIds:DELETED", traderId).exec();
  const traderDeletedEvent = {
    "common": header,
    "reason": Math.random() >= 0.5 ? faker3.lorem.lines({ min: 1, max: 3 }) : ""
  };
  return traderDeletedEvent;
};

// product_events.js
import { fakerSR_RS_latin as faker4 } from "@faker-js/faker";
var createProduct = async () => {
  const header = genHeader(EventTypes.ProductCreated, EntityTypes.Product);
  const traderType = faker4.helpers.arrayElement(TRADER_TYPES);
  const category = faker4.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);
  const productName = `${category.name} ${faker4.commerce.productAdjective()}`;
  await redis.sadd("pool:productIds", header.entity_id);
  const productCreatedEvent = {
    "common": header,
    "name": productName,
    "price": parseFloat(faker4.number.float({
      min: category.priceRange[0],
      max: category.priceRange[1],
      fractionDigits: 2
    })),
    "quantity": quantity,
    trader_type: traderType,
    "expiry_date": faker4.date.soon().getTime()
  };
  return productCreatedEvent;
};
var deleteProduct = async () => {
  const productId = await redis.srandmember("pool:productIds");
  if (!productId) throw new Error("No active products available to delete");
  const header = genHeader(EventTypes.ProductDeleted, EntityTypes.Product, productId);
  await redis.multi().srem("pool:productIds", productId).sadd("pool:productIds:DELETED", productId).exec();
  const productDeletedEvent = {
    "common": header
  };
  return productDeletedEvent;
};

// order_events.js
import { fakerSR_RS_latin as faker5 } from "@faker-js/faker";
var createOrder = async () => {
  const header = genHeader(EventTypes.OrderCreated, EntityTypes.Order);
  const includeRequest = Math.random() >= 0.5;
  const [[, userId], [, productIds], [, requestIds]] = await redis.pipeline().srandmember("pool:userIds").srandmember("pool:productIds", numProducts).srandmember(`pool:requestIds:${RequestStatus.FULFILLED}`, includeRequest ? 1 : 0).exec();
  const products = productIds.map((product_id) => ({
    product_id,
    quantity: faker5.number.int({ min: 1, max: 5 }),
    price: parseFloat(faker5.number.float({ min: 100, max: 5e4, fractionDigits: 2 }))
  }));
  const total_cost = parseFloat(
    products.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)
  );
  await redis.sadd(`pool:orderIds:${OrderStatus.CREATED}`, header.entity_id);
  return {
    common: header,
    user_id: userId,
    products,
    total_cost,
    request_id: requestIds?.[0] ?? ""
  };
};
var approveOrder = async () => {
  const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.CREATED}`);
  if (!orderId) return null;
  const header = genHeader(EventTypes.OrderApproved, EntityTypes.Order, orderId);
  const traderId = await redis.srandmember("pool:traderIds");
  await moveEntityStatus(orderId, "order", OrderStatus.CREATED, OrderStatus.APPROVED);
  return {
    common: header,
    order_id: orderId,
    trader_id: traderId
  };
};
var cancelOrder = async () => {
  const [[, createdId], [, approvedId]] = await redis.pipeline().srandmember(`pool:orderIds:${OrderStatus.CREATED}`).srandmember(`pool:orderIds:${OrderStatus.APPROVED}`).exec();
  const orderId = createdId || approvedId;
  if (!orderId) return null;
  const fromStatus = createdId ? OrderStatus.CREATED : OrderStatus.APPROVED;
  const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order, orderId);
  const userId = await redis.srandmember("pool:userIds");
  await moveEntityStatus(orderId, "order", fromStatus, OrderStatus.CANCELLED);
  return {
    common: header,
    order_id: orderId,
    user_id: userId,
    reason: Math.random() >= 0.5 ? faker5.lorem.lines({ min: 1, max: 3 }) : ""
  };
};
var fulfillOrder = async () => {
  const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.APPROVED}`);
  if (!orderId) return null;
  const header = genHeader(EventTypes.OrderFulfilled, EntityTypes.Order, orderId);
  const [[, traderId], [, productIds]] = await redis.pipeline().srandmember("pool:traderIds").srandmember("pool:productIds", numProducts).exec();
  const products = productIds.map((product_id) => ({
    product_id,
    quantity: faker5.number.int({ min: 1, max: 5 }),
    price: parseFloat(faker5.number.float({ min: 100, max: 5e4, fractionDigits: 2 }))
  }));
  await moveEntityStatus(orderId, "order", OrderStatus.APPROVED, OrderStatus.FULFILLED);
  return {
    common: header,
    trader_id: traderId,
    products
  };
};
var completeOrder = async () => {
  const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.FULFILLED}`);
  if (!orderId) return null;
  const userId = await redis.srandmember("pool:userIds");
  const header = genHeader(EventTypes.OrderCompleted, EntityTypes.Order, orderId);
  const receiptCount = faker5.number.int({ min: 1, max: 6 });
  const receiptIds = await redis.srandmember(`pool:receiptIds:${ReceiptStatus.CREATED}`, receiptCount);
  await moveEntityStatus(orderId, "order", OrderStatus.FULFILLED, OrderStatus.COMPLETED);
  return {
    common: header,
    user_id: userId,
    receipt_ids: receiptIds ?? []
  };
};

// receipt_events.js
import { fakerSR_RS_latin as faker6 } from "@faker-js/faker";
var createReceipt = async () => {
  const header = genHeader(EventTypes.ReceiptCreated, EntityTypes.Receipt);
  const [[, userId], [, productIds], [, traderId]] = await redis.pipeline().srandmember("pool:userIds").srandmember("pool:productIds", numProducts).srandmember("pool:traderIds").exec();
  const products = productIds.map((product_id) => ({
    product_id,
    quantity,
    price: parseFloat(faker6.number.float({ min: 100, max: 5e4, fractionDigits: 2 }))
  }));
  const total_cost = parseFloat(
    products.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)
  );
  await redis.sadd(`pool:receiptIds:${ReceiptStatus.CREATED}`, header.entity_id);
  const receiptCreatedEvent = {
    "common": header,
    "user_id": userId,
    "trader_id": traderId,
    "products": products,
    "total_cost": total_cost,
    "due_date": faker6.date.soon().getTime()
  };
  return receiptCreatedEvent;
};
var cancelReceipt = async () => {
  const receiptId = await redis.srandmember(`pool:receiptIds:${ReceiptStatus.CREATED}`);
  const header = genHeader(EventTypes.ReceiptCancelled, EntityTypes.Receipt, receiptId);
  await moveEntityStatus(receiptId, EntityTypes.Receipt.toLowerCase(), ReceiptStatus.CREATED, ReceiptStatus.CANCELLED);
  const receiptCancelledEvent = {
    "common": header,
    "reason": Math.random() >= 0.5 ? faker6.lorem.lines({ min: 1, max: 3 }) : ""
  };
  return receiptCancelledEvent;
};

// request_events.js
import { fakerSR_RS_latin as faker7 } from "@faker-js/faker";
var createRequest = async () => {
  const header = genHeader(EventTypes.RequestCreated, EntityTypes.Request);
  const [[, userId], [, productIds], [, traderId]] = await redis.pipeline().srandmember("pool:userIds").srandmember("pool:productIds", numProducts).srandmember("pool:traderIds").exec();
  const products = productIds.map((product_id) => ({
    product_id,
    quantity: faker7.number.int({ min: 1, max: 5 }),
    price: parseFloat(faker7.number.float({ min: 100, max: 5e4, fractionDigits: 2 }))
  }));
  const total_cost = parseFloat(
    products.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)
  );
  await redis.sadd(`pool:requestIds:${RequestStatus.CREATED}`, header.entity_id);
  ;
  return {
    common: header,
    user_id: userId,
    trader_id: traderId,
    products,
    total_cost,
    due_date: faker7.date.future().getTime()
  };
};
var pendingRequest = async () => {
  const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.CREATED}`);
  if (!requestId) return null;
  const header = genHeader(EventTypes.RequestPending, EntityTypes.Request, requestId);
  await moveEntityStatus(requestId, "request", RequestStatus.CREATED, RequestStatus.PENDING_FUNDS);
  ;
  return {
    common: header,
    request_id: requestId
  };
};
var approveRequest = async () => {
  const [[, createdId], [, pendingId]] = await redis.pipeline().srandmember(`pool:requestIds:${RequestStatus.CREATED}`).srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`).exec();
  const requestId = createdId || pendingId;
  if (!requestId) return null;
  const fromStatus = createdId ? RequestStatus.CREATED : RequestStatus.PENDING_FUNDS;
  const header = genHeader(EventTypes.RequestApproved, EntityTypes.Request, requestId);
  const traderId = await redis.srandmember("pool:traderIds");
  await moveEntityStatus(requestId, "request", fromStatus, RequestStatus.APPROVED);
  ;
  return {
    common: header,
    request_id: requestId,
    trader_id: traderId
  };
};
var rejectRequest = async () => {
  const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`);
  if (!requestId) return null;
  const header = genHeader(EventTypes.RequestRejected, EntityTypes.Request, requestId);
  const traderId = await redis.srandmember("pool:traderIds");
  await moveEntityStatus(requestId, "request", RequestStatus.PENDING_FUNDS, RequestStatus.REJECTED);
  return {
    common: header,
    request_id: requestId,
    trader_id: traderId,
    reason: Math.random() >= 0.5 ? faker7.lorem.lines({ min: 1, max: 3 }) : ""
  };
};
var fulfillRequest = async () => {
  const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.APPROVED}`);
  if (!requestId) return null;
  const header = genHeader(EventTypes.RequestFulfilled, EntityTypes.Request, requestId);
  const [[, traderId], [, orderId]] = await redis.pipeline().srandmember("pool:traderIds").srandmember(`pool:orderIds:${OrderStatus.COMPLETED}`).exec();
  await moveEntityStatus(requestId, "request", RequestStatus.APPROVED, RequestStatus.FULFILLED);
  ;
  return {
    common: header,
    request_id: requestId,
    trader_id: traderId,
    order_id: orderId ?? ""
  };
};
var expireRequest = async () => {
  const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`);
  if (!requestId) return null;
  const header = genHeader(EventTypes.RequestExpired, EntityTypes.Request, requestId);
  await moveEntityStatus(requestId, "request", RequestStatus.PENDING_FUNDS, RequestStatus.EXPIRED);
  ;
  return {
    common: header,
    request_id: requestId,
    due_date: faker7.date.past().getTime()
  };
};
var cancelRequest = async () => {
  const [[, createdId], [, pendingId], [, approvedId]] = await redis.pipeline().srandmember(`pool:requestIds:${RequestStatus.CREATED}`).srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`).srandmember(`pool:requestIds:${RequestStatus.APPROVED}`).exec();
  const requestId = createdId || pendingId || approvedId;
  if (!requestId) return null;
  const fromStatus = createdId ? RequestStatus.CREATED : pendingId ? RequestStatus.PENDING_FUNDS : RequestStatus.APPROVED;
  const header = genHeader(EventTypes.RequestCancelled, EntityTypes.Request, requestId);
  const userId = await redis.srandmember("pool:userIds");
  await moveEntityStatus(requestId, "request", fromStatus, RequestStatus.CANCELLED);
  ;
  return {
    common: header,
    request_id: requestId,
    user_id: userId,
    reason: Math.random() >= 0.5 ? faker7.lorem.lines({ min: 1, max: 3 }) : ""
  };
};

// ../batch-generator/constants.js
var TRADER_TYPES = ["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"];
var PRODUCT_CATEGORIES = {
  SUPERMARKET: [
    { name: "Mleko", priceRange: [100, 200], expiry: true },
    { name: "Hleb", priceRange: [50, 120], expiry: true },
    { name: "Jogurt", priceRange: [80, 150], expiry: true },
    { name: "Sir", priceRange: [300, 800], expiry: true },
    { name: "Jaja", priceRange: [200, 350], expiry: true },
    { name: "Piletina", priceRange: [400, 900], expiry: true },
    { name: "Paradajz", priceRange: [100, 250], expiry: true },
    { name: "Krompir", priceRange: [50, 150], expiry: true },
    { name: "Pasta", priceRange: [150, 300], expiry: false },
    { name: "Pirina\u010D", priceRange: [200, 400], expiry: false },
    { name: "Ulje", priceRange: [300, 600], expiry: false },
    { name: "\u0160e\u0107er", priceRange: [100, 250], expiry: false },
    { name: "Bra\u0161no", priceRange: [80, 200], expiry: false },
    { name: "Kafa", priceRange: [400, 1200], expiry: false },
    { name: "\u010Caj", priceRange: [150, 400], expiry: false },
    { name: "Sok", priceRange: [100, 300], expiry: true },
    { name: "Vino", priceRange: [500, 3e3], expiry: false },
    { name: "Pivo", priceRange: [80, 250], expiry: true },
    { name: "\u010Cokolada", priceRange: [100, 500], expiry: true },
    { name: "Keks", priceRange: [150, 400], expiry: true }
  ],
  PHARMACY: [
    { name: "Brufen", priceRange: [200, 500], expiry: true },
    { name: "Aspirin", priceRange: [150, 400], expiry: true },
    { name: "Antibiotik", priceRange: [500, 2e3], expiry: true },
    { name: "Sirup za ka\u0161alj", priceRange: [300, 800], expiry: true },
    { name: "Vitamini", priceRange: [400, 1500], expiry: true },
    { name: "Kapi za nos", priceRange: [200, 600], expiry: true },
    { name: "Zavoj", priceRange: [100, 300], expiry: false },
    { name: "Flaster", priceRange: [80, 250], expiry: false },
    { name: "Termometar", priceRange: [500, 1500], expiry: false },
    { name: "Maska za lice", priceRange: [50, 200], expiry: false },
    { name: "Dezinfekciono sredstvo", priceRange: [200, 600], expiry: false },
    { name: "Pasta za zube", priceRange: [150, 400], expiry: false },
    { name: "\u0160ampon", priceRange: [300, 800], expiry: false },
    { name: "Krema za lice", priceRange: [500, 2e3], expiry: true }
  ],
  GROCERY: [
    { name: "Hleb", priceRange: [50, 120], expiry: true },
    { name: "Burek", priceRange: [100, 200], expiry: true },
    { name: "Pita", priceRange: [150, 300], expiry: true },
    { name: "Kifla", priceRange: [30, 80], expiry: true },
    { name: "Kroasan", priceRange: [80, 150], expiry: true },
    { name: "Torta", priceRange: [500, 2e3], expiry: true },
    { name: "Kola\u010D", priceRange: [200, 600], expiry: true },
    { name: "Sendvi\u010D", priceRange: [150, 400], expiry: true },
    { name: "Salata", priceRange: [200, 500], expiry: true },
    { name: "Vo\u0107e", priceRange: [100, 400], expiry: true },
    { name: "Povr\u0107e", priceRange: [80, 300], expiry: true },
    { name: "Sok", priceRange: [100, 250], expiry: true },
    { name: "Voda", priceRange: [50, 150], expiry: false },
    { name: "Cigarete", priceRange: [300, 500], expiry: false }
  ],
  CARDEALER: [
    { name: "Sedi\u0161te", priceRange: [15e3, 5e4], expiry: false },
    { name: "Volan", priceRange: [8e3, 25e3], expiry: false },
    { name: "Retrovizor", priceRange: [3e3, 12e3], expiry: false },
    { name: "Far", priceRange: [5e3, 2e4], expiry: false },
    { name: "To\u010Dak", priceRange: [1e4, 4e4], expiry: false },
    { name: "Akumulator", priceRange: [8e3, 3e4], expiry: false },
    { name: "Filter za ulje", priceRange: [500, 2e3], expiry: false },
    { name: "Ko\u010Dione plo\u010Dice", priceRange: [3e3, 1e4], expiry: false },
    { name: "Diskovi", priceRange: [5e3, 15e3], expiry: false },
    { name: "Amortizer", priceRange: [4e3, 15e3], expiry: false },
    { name: "Motorno ulje", priceRange: [2e3, 8e3], expiry: false },
    { name: "Antifriz", priceRange: [1e3, 3e3], expiry: false },
    { name: "Starter", priceRange: [1e4, 3e4], expiry: false },
    { name: "Alternator", priceRange: [15e3, 4e4], expiry: false }
  ]
};
var EventTypes = Object.freeze({
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
var EntityTypes = Object.freeze({
  User: "User",
  Trader: "Trader",
  Product: "Product",
  Order: "Order",
  Receipt: "Receipt",
  Request: "Request"
});
var numProducts = faker8.helpers.weightedArrayElement([
  { weight: 10, value: 1 },
  { weight: 15, value: 2 },
  { weight: 20, value: 3 },
  { weight: 18, value: 4 },
  { weight: 15, value: 5 },
  { weight: 10, value: 6 },
  { weight: 7, value: 7 },
  { weight: 5, value: 8 }
]);
var quantity = faker8.helpers.weightedArrayElement([
  { weight: 40, value: 1 },
  { weight: 30, value: 2 },
  { weight: 15, value: 3 },
  { weight: 10, value: 4 },
  { weight: 5, value: 5 }
]);
var OrderStatus = Object.freeze({
  CREATED: "CREATED",
  APPROVED: "APPROVED",
  FULFILLED: "FULFILLED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
});
var ReceiptStatus = Object.freeze({
  CREATED: "CREATED",
  CANCELLED: "CANCELLED"
});
var RequestStatus = Object.freeze({
  CREATED: "CREATED",
  PENDING_FUNDS: "PENDING_FUNDS",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  FULFILLED: "FULFILLED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED"
});
var VALID_TRANSITIONS = {
  order: {
    [OrderStatus.CREATED]: [OrderStatus.APPROVED, OrderStatus.CANCELLED],
    [OrderStatus.APPROVED]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
    [OrderStatus.FULFILLED]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: []
  },
  receipt: {
    [ReceiptStatus.CREATED]: [ReceiptStatus.CANCELLED],
    [ReceiptStatus.CANCELLED]: []
  },
  request: {
    [RequestStatus.CREATED]: [RequestStatus.PENDING_FUNDS, RequestStatus.APPROVED, RequestStatus.CANCELLED],
    [RequestStatus.PENDING_FUNDS]: [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.EXPIRED, RequestStatus.CANCELLED],
    [RequestStatus.APPROVED]: [RequestStatus.FULFILLED, RequestStatus.CANCELLED],
    [RequestStatus.REJECTED]: [],
    [RequestStatus.FULFILLED]: [],
    [RequestStatus.EXPIRED]: [],
    [RequestStatus.CANCELLED]: []
  }
};
var EVENT_GENERATORS = {
  user: {
    created: createUser,
    deleted: deleteUser
  },
  trader: {
    created: createTrader,
    deleted: deleteTrader
  },
  product: {
    created: createProduct,
    deleted: deleteProduct
  },
  order: {
    created: createOrder,
    approved: approveOrder,
    fulfilled: fulfillOrder,
    completed: completeOrder,
    cancelled: cancelOrder
  },
  receipt: {
    created: createReceipt,
    cancelled: cancelReceipt
  },
  request: {
    created: createRequest,
    pending_funds: pendingRequest,
    approved: approveRequest,
    rejected: rejectRequest,
    fulfilled: fulfillRequest,
    expired: expireRequest,
    cancelled: cancelRequest
  }
};
var randomEntityAction = () => {
  const entities = Object.keys(EVENT_GENERATORS);
  const entity2 = entities[Math.floor(Math.random() * entities.length)];
  const actions = Object.keys(EVENT_GENERATORS[entity2]);
  const action2 = actions[Math.floor(Math.random() * actions.length)];
  return { entity: entity2, action: action2 };
};

// ../batch-generator/utils.js
var parseSchema = (schema_name) => {
  return JSON.parse(fs.readFileSync(`../../schemas/streams-schemas/${schema_name}.avsc`, "utf8"));
};
var moveEntityStatus = async (id, entity2, fromStatus, toStatus) => {
  const entityTransitions = VALID_TRANSITIONS[entity2];
  if (!entityTransitions) {
    throw new Error(`Invalid entity type: ${entity2}. Must be one of: ${Object.keys(VALID_TRANSITIONS).join(", ")}`);
  }
  const allowedTransitions = entityTransitions[fromStatus];
  if (!allowedTransitions) {
    throw new Error(`Invalid fromStatus "${fromStatus}" for entity "${entity2}". Must be one of: ${Object.keys(entityTransitions).join(", ")}`);
  }
  if (!allowedTransitions.includes(toStatus)) {
    throw new Error(`Invalid transition for "${entity2}": ${fromStatus} \u2192 ${toStatus}. Allowed: ${allowedTransitions.join(", ") || "none (terminal status)"}`);
  }
  await redis.pipeline().srem(`pool:${entity2}Ids:${fromStatus}`, id).sadd(`pool:${entity2}Ids:${toStatus}`, id).exec();
};

// generate_stream_data.mjs
var headerSchema = parseSchema("schema-header");
var { entity, action } = randomEntityAction();
console.log(`Generating event: ${entity}-${action}`);
var schemaPath = `${entity}/${entity}-${action}`;
var schema = parseSchema(schemaPath);
var registry = {};
avsc.Type.forSchema(headerSchema, { registry });
var EventType = avsc.Type.forSchema(schema, { registry });
var generator = EVENT_GENERATORS[entity]?.[action];
if (!generator) throw new Error(`No generator for ${entity}-${action}`);
var event = await generator();
console.log("Event:", event);
var buf = EventType.toBuffer(event);
fs2.writeFileSync(`${entity}-${action}.avro`, buf);
var decoded = EventType.fromBuffer(buf);
console.log("Decoded:", decoded);
await redis.quit();
