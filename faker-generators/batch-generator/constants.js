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