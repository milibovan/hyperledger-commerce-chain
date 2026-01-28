import { fakerSR_RS_latin as faker } from '@faker-js/faker';

import fs from "fs";

const COUNTS = {
    users: 50000,
    traders: 5000,
    products: 20000,
    orders: 500000,
    receipts: 1000000,
    requests: 100000
};

const pools = {
    userIds: [],
    traderIds: [],
    productIds: [],
    orderIds: []
};

const writeJSONL = (filename, count, generator) => {
    const stream = fs.createWriteStream(filename);
    for (let i = 0; i < count; i++) {
        const record = generator();
        stream.write(JSON.stringify(record) + '\n');
    }
    stream.end();
    console.log(`Created ${filename} (${count} records)`);
};

const genUser = () => {
    const id = faker.string.uuid();
    pools.userIds.push(id);
    return {
        "doc-type": "user", "id": id, "name": faker.person.firstName(),
        "surname": faker.person.lastName(), "email": faker.internet.email(),
        "balance": parseFloat(faker.finance.amount(500, 5000, 2)), "deleted": false
    };
};

const genTrader = () => {
    const id = faker.string.uuid();
    pools.traderIds.push(id);
    return {
        "doc-type": "trader", "id": id, "name": faker.company.name(),
        "trader-type": faker.helpers.arrayElement(["SUPERMARKET", "PHARMACY", "GROCERY"]),
        "vat": "VAT-" + faker.string.alphanumeric(8).toUpperCase(), "balance": 0, "deleted": false
    };
};

const genProduct = () => {
    const id = faker.string.uuid();
    pools.productIds.push(id);
    return {
        "doc-type": "product", "id": id, "name": faker.commerce.productName(),
        "price": parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        "quantity": faker.number.int({ min: 0, max: 1000 }), "deleted": false
    };
};

const genOrder = () => {
    const id = faker.string.uuid();
    pools.orderIds.push(id);
    const orderDate = faker.date.between({ from: '2024-01-01', to: '2025-12-31' });
    return {
        "doc-type": "order", "id": id,
        "user-id": faker.helpers.arrayElement(pools.userIds), // Links to real user
        "status": faker.helpers.arrayElement(["PENDING", "APPROVED", "FULFILLED", "CANCELLED"]),
        "created-date": orderDate.toISOString(),
        "products": Array.from({ length: 2 }, () => ({
            "product-id": faker.helpers.arrayElement(pools.productIds),
            "quantity": faker.number.int({ min: 1, max: 5 })
        })),
        "total-cost": parseFloat(faker.commerce.price({ min: 20, max: 2000 })),
        "deleted": false
    };
};

const genReceipt = () => {
    return {
        "doc-type": "receipt", "id": faker.string.uuid(),
        "trader-id": faker.helpers.arrayElement(pools.traderIds),
        "user-id": faker.helpers.arrayElement(pools.userIds),
        "order-id": faker.helpers.arrayElement(pools.orderIds),
        "date": faker.date.recent().toISOString(),
        "status": "COMPLETED", "deleted": false
    };
};

const genRequest = () => {
    return {
        "doc-type": "product-request", "id": faker.string.uuid(),
        "user-id": faker.helpers.arrayElement(pools.userIds),
        "trader-id": faker.helpers.arrayElement(pools.traderIds),
        "status": "CREATED", "deleted": false
    };
};

console.log("Starting generation...");
writeJSONL('users.jsonl', COUNTS.users, genUser);
writeJSONL('traders.jsonl', COUNTS.traders, genTrader);
writeJSONL('products.jsonl', COUNTS.products, genProduct);

setTimeout(() => {
    writeJSONL('orders.jsonl', COUNTS.orders, genOrder);
    writeJSONL('order_requests.jsonl', COUNTS.requests, genRequest);
    
    // Receipts last to ensure they can link to orders
    setTimeout(() => {
        writeJSONL('receipts.jsonl', COUNTS.receipts, genReceipt);
    }, 200);
}, 200);