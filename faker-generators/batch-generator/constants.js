import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { createUser, deleteUser } from '../stream-generator/user_events.js';
import { createTrader, deleteTrader } from '../stream-generator/trader_events.js';
import { createProduct, deleteProduct } from '../stream-generator/product_events.js';
import { createOrder, approveOrder, fulfillOrder, completeOrder, cancelOrder } from '../stream-generator/order_events.js';
import { createReceipt, cancelReceipt } from '../stream-generator/receipt_events.js';
import { createRequest, pendingRequest, approveRequest, rejectRequest, fulfillRequest, expireRequest, cancelRequest } from '../stream-generator/request_events.js';

export const COUNTS = {
    users: 50000,
    traders: 5000,
    products: 20000,
    orders: 500000,
    receipts: 500000,
    requests: 100000,
};

export const TRADER_TYPES = ["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"];

export const VERSATILE_USER_COUNT = 5000; // ~10% of users guaranteed to hit HAVING >= 3 trader types
export const VERSATILE_RECEIPT_RATIO = 0.4; // 40% of receipts go to versatile users

export const FULFILLMENT_PROFILES = {
    SUPERMARKET: { minLeadDays: 1, maxLeadDays: 14 },
    PHARMACY: { minLeadDays: 3, maxLeadDays: 30 },
    GROCERY: { minLeadDays: 1, maxLeadDays: 7 },
    CARDEALER: { minLeadDays: 30, maxLeadDays: 120 },
};

export const PRODUCT_CATEGORIES = {
    SUPERMARKET: [
        { name: 'Mleko', priceRange: [100, 200], expiry: true },
        { name: 'Hleb', priceRange: [50, 120], expiry: true },
        { name: 'Jogurt', priceRange: [80, 150], expiry: true },
        { name: 'Sir', priceRange: [300, 800], expiry: true },
        { name: 'Jaja', priceRange: [200, 350], expiry: true },
        { name: 'Piletina', priceRange: [400, 900], expiry: true },
        { name: 'Paradajz', priceRange: [100, 250], expiry: true },
        { name: 'Krompir', priceRange: [50, 150], expiry: true },
        { name: 'Pasta', priceRange: [150, 300], expiry: false },
        { name: 'Pirinač', priceRange: [200, 400], expiry: false },
        { name: 'Ulje', priceRange: [300, 600], expiry: false },
        { name: 'Šećer', priceRange: [100, 250], expiry: false },
        { name: 'Brašno', priceRange: [80, 200], expiry: false },
        { name: 'Kafa', priceRange: [400, 1200], expiry: false },
        { name: 'Čaj', priceRange: [150, 400], expiry: false },
        { name: 'Sok', priceRange: [100, 300], expiry: true },
        { name: 'Vino', priceRange: [500, 3000], expiry: false },
        { name: 'Pivo', priceRange: [80, 250], expiry: true },
        { name: 'Čokolada', priceRange: [100, 500], expiry: true },
        { name: 'Keks', priceRange: [150, 400], expiry: true },
    ],
    PHARMACY: [
        { name: 'Brufen', priceRange: [200, 500], expiry: true },
        { name: 'Aspirin', priceRange: [150, 400], expiry: true },
        { name: 'Antibiotik', priceRange: [500, 2000], expiry: true },
        { name: 'Sirup za kašalj', priceRange: [300, 800], expiry: true },
        { name: 'Vitamini', priceRange: [400, 1500], expiry: true },
        { name: 'Kapi za nos', priceRange: [200, 600], expiry: true },
        { name: 'Zavoj', priceRange: [100, 300], expiry: false },
        { name: 'Flaster', priceRange: [80, 250], expiry: false },
        { name: 'Termometar', priceRange: [500, 1500], expiry: false },
        { name: 'Maska za lice', priceRange: [50, 200], expiry: false },
        { name: 'Dezinfekciono sredstvo', priceRange: [200, 600], expiry: false },
        { name: 'Pasta za zube', priceRange: [150, 400], expiry: false },
        { name: 'Šampon', priceRange: [300, 800], expiry: false },
        { name: 'Krema za lice', priceRange: [500, 2000], expiry: true },
    ],
    GROCERY: [
        { name: 'Hleb', priceRange: [50, 120], expiry: true },
        { name: 'Burek', priceRange: [100, 200], expiry: true },
        { name: 'Pita', priceRange: [150, 300], expiry: true },
        { name: 'Kifla', priceRange: [30, 80], expiry: true },
        { name: 'Kroasan', priceRange: [80, 150], expiry: true },
        { name: 'Torta', priceRange: [500, 2000], expiry: true },
        { name: 'Kolač', priceRange: [200, 600], expiry: true },
        { name: 'Sendvič', priceRange: [150, 400], expiry: true },
        { name: 'Salata', priceRange: [200, 500], expiry: true },
        { name: 'Voće', priceRange: [100, 400], expiry: true },
        { name: 'Povrće', priceRange: [80, 300], expiry: true },
        { name: 'Sok', priceRange: [100, 250], expiry: true },
        { name: 'Voda', priceRange: [50, 150], expiry: false },
        { name: 'Cigarete', priceRange: [300, 500], expiry: false },
    ],
    CARDEALER: [
        { name: 'Sedište', priceRange: [15000, 50000], expiry: false },
        { name: 'Volan', priceRange: [8000, 25000], expiry: false },
        { name: 'Retrovizor', priceRange: [3000, 12000], expiry: false },
        { name: 'Far', priceRange: [5000, 20000], expiry: false },
        { name: 'Točak', priceRange: [10000, 40000], expiry: false },
        { name: 'Akumulator', priceRange: [8000, 30000], expiry: false },
        { name: 'Filter za ulje', priceRange: [500, 2000], expiry: false },
        { name: 'Kočione pločice', priceRange: [3000, 10000], expiry: false },
        { name: 'Diskovi', priceRange: [5000, 15000], expiry: false },
        { name: 'Amortizer', priceRange: [4000, 15000], expiry: false },
        { name: 'Motorno ulje', priceRange: [2000, 8000], expiry: false },
        { name: 'Antifriz', priceRange: [1000, 3000], expiry: false },
        { name: 'Starter', priceRange: [10000, 30000], expiry: false },
        { name: 'Alternator', priceRange: [15000, 40000], expiry: false },
    ],
};

export const EventTypes = Object.freeze({
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

export const EntityTypes = Object.freeze({
    User: "User",
    Trader: "Trader",
    Product: "Product",
    Order: "Order",
    Receipt: "Receipt",
    Request: "Request"
});

export const numProducts = faker.helpers.weightedArrayElement([
    { weight: 10, value: 1 },
    { weight: 15, value: 2 },
    { weight: 20, value: 3 },
    { weight: 18, value: 4 },
    { weight: 15, value: 5 },
    { weight: 10, value: 6 },
    { weight: 7, value: 7 },
    { weight: 5, value: 8 },
]);

export const quantity = faker.helpers.weightedArrayElement([
    { weight: 40, value: 1 },
    { weight: 30, value: 2 },
    { weight: 15, value: 3 },
    { weight: 10, value: 4 },
    { weight: 5, value: 5 },
]);

export const OrderStatus = Object.freeze({
    CREATED: 'CREATED',
    APPROVED: 'APPROVED',
    FULFILLED: 'FULFILLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
});

export const ReceiptStatus = Object.freeze({
    CREATED: 'CREATED',
    CANCELLED: 'CANCELLED'
});

export const RequestStatus = Object.freeze({
    CREATED: 'CREATED',
    PENDING_FUNDS: 'PENDING_FUNDS',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    FULFILLED: 'FULFILLED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
});

export const VALID_TRANSITIONS = {
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

export const EVENT_GENERATORS = {
    user: {
        created: createUser,
        deleted: deleteUser,
    },
    trader: {
        created: createTrader,
        deleted: deleteTrader,
    },
    product: {
        created: createProduct,
        deleted: deleteProduct,
    },
    order: {
        created: createOrder,
        approved: approveOrder,
        fulfilled: fulfillOrder,
        completed: completeOrder,
        cancelled: cancelOrder,
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

const WEIGHTS_BASELINE = {
  user:    { created: 2,  deleted: 1 },
  trader:  { created: 1,  deleted: 1 },
  product: { created: 2,  deleted: 1 },
  order:   { created: 10, approved: 7, fulfilled: 6, completed: 5, cancelled: 2 },
  receipt: { created: 6,  cancelled: 1 },
  request: { created: 5,  pending_funds: 4, approved: 4, rejected: 2, fulfilled: 3, expired: 1, cancelled: 2 },
};

// Each mode multiplies on top of baseline weights
const MODE_OVERRIDES = {
  // Query 1 — demand spike: flood one product with orders/receipts
  demand_spike: {
    product: { created: 1, deleted: 1 },
    order:   { created: 40, approved: 30, fulfilled: 25, completed: 20, cancelled: 2 },
    receipt: { created: 30, cancelled: 1 },
    request: { created: 2,  pending_funds: 1, approved: 1, rejected: 1, fulfilled: 1, expired: 1, cancelled: 1 },
    user:    { created: 1,  deleted: 1 },
    trader:  { created: 1,  deleted: 1 },
  },
  // Query 2 — fraud: same user hammering cancellations
  fraud: {
    order:   { created: 15, approved: 10, fulfilled: 2, completed: 2, cancelled: 40 },
    receipt: { created: 2,  cancelled: 10 },
    request: { created: 3,  pending_funds: 2, approved: 2, rejected: 3, fulfilled: 1, expired: 2, cancelled: 20 },
    user:    { created: 1,  deleted: 1 },
    trader:  { created: 1,  deleted: 1 },
    product: { created: 1,  deleted: 1 },
  },
  // Query 3 — completed volume: push orders through full lifecycle
  completed_volume: {
    order:   { created: 15, approved: 14, fulfilled: 13, completed: 25, cancelled: 1 },
    receipt: { created: 20, cancelled: 1 },
    request: { created: 10, pending_funds: 9, approved: 9, rejected: 1, fulfilled: 12, expired: 1, cancelled: 1 },
    user:    { created: 1,  deleted: 1 },
    trader:  { created: 1,  deleted: 1 },
    product: { created: 1,  deleted: 1 },
  },
  // Query 4 — congestion: lots of created/pending, few fulfilled
  congestion: {
    order:   { created: 40, approved: 15, fulfilled: 3, completed: 2, cancelled: 5 },
    request: { created: 30, pending_funds: 25, approved: 5, rejected: 5, fulfilled: 2, expired: 3, cancelled: 4 },
    receipt: { created: 5,  cancelled: 1 },
    user:    { created: 1,  deleted: 1 },
    trader:  { created: 1,  deleted: 1 },
    product: { created: 1,  deleted: 1 },
  },
  // Query 5 — whale alert: high-value orders dominate
  whale: {
    order:   { created: 30, approved: 20, fulfilled: 10, completed: 8, cancelled: 2 },
    receipt: { created: 15, cancelled: 1 },
    request: { created: 5,  pending_funds: 4, approved: 4, rejected: 1, fulfilled: 3, expired: 1, cancelled: 1 },
    user:    { created: 1,  deleted: 1 },
    trader:  { created: 1,  deleted: 1 },
    product: { created: 1,  deleted: 1 },
  },
};

function buildWeightedPool(weights) {
  const pool = [];
  for (const [entity, actions] of Object.entries(weights)) {
    for (const [action, weight] of Object.entries(actions)) {
      for (let i = 0; i < weight; i++) {
        pool.push({ entity, action });
      }
    }
  }
  return pool;
}

function randomEntityAction() {
  const mode = process.env.MODE;
  const weights = mode && MODE_OVERRIDES[mode] ? MODE_OVERRIDES[mode] : WEIGHTS_BASELINE;
  const pool = buildWeightedPool(weights);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ! for totally random events
// export const randomEntityAction = () => {
//     const entities = Object.keys(EVENT_GENERATORS);
//     const entity = entities[Math.floor(Math.random() * entities.length)];
    
//     const actions = Object.keys(EVENT_GENERATORS[entity]);
//     const action = actions[Math.floor(Math.random() * actions.length)];
    
//     return { entity, action };
// };

// const buildAllEvents = () =>
//     Object.entries(EVENT_GENERATORS).flatMap(([entity, actions]) =>
//         Object.keys(actions).map(action => ({ entity, action }))
//     );

// const shuffle = (arr) => {
//     const a = [...arr];
//     for (let i = a.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [a[i], a[j]] = [a[j], a[i]];
//     }
//     return a;
// };

// let eventQueue = [];

// export const randomEntityAction = () => {
//     if (eventQueue.length === 0) {
//         eventQueue = shuffle(buildAllEvents());
//     }
//     return eventQueue.pop();
// };

// export const getAllEvents = () =>
//     Object.entries(EVENT_GENERATORS).flatMap(([entity, actions]) =>
//         Object.keys(actions).map(action => ({ entity, action }))
//     );