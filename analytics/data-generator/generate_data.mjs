import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import fs from "fs";

const COUNTS = {
    users: 500000,
    traders: 70000,
    products: 600000,
    orders: 2500000,
    receipts: 2500000
};

const TRADER_TYPES = ["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"];

const FULFILLMENT_PROFILES = {
    SUPERMARKET: { minLeadDays: 1, maxLeadDays: 14 },
    PHARMACY: { minLeadDays: 3, maxLeadDays: 30 },
    GROCERY: { minLeadDays: 1, maxLeadDays: 7 },
    CARDEALER: { minLeadDays: 30, maxLeadDays: 120 },
};

const pools = {
    userIds: [],
    traderIds: [],
    productIds: [],
    orderIds: [],
    productsByTrader: {},
    userOrders: {},
    traderReceipts: {},
    traderProducts: {},
    orderReceipts: {},
    traderTypeMap: {},
    tradersByType: {},
    orderDates: {},
    orderTraderTypes: {},
    productPrices: {},
    productTraderType: {}
};

const PRODUCT_CATEGORIES = {
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
        { name: 'Keks', priceRange: [150, 400], expiry: true }
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
        { name: 'Krema za lice', priceRange: [500, 2000], expiry: true }
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
        { name: 'Cigarete', priceRange: [300, 500], expiry: false }
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
        { name: 'Alternator', priceRange: [15000, 40000], expiry: false }
    ]
};

const computeStatusWeights = (traderType, totalCost, leadDays, numProducts) => {
    const base = {
        GROCERY: { COMPLETED: 50, FULFILLED: 25, APPROVED: 10, PENDING: 10, CANCELLED: 5 },
        SUPERMARKET: { COMPLETED: 35, FULFILLED: 30, APPROVED: 15, PENDING: 12, CANCELLED: 8 },
        PHARMACY: { COMPLETED: 30, FULFILLED: 25, APPROVED: 20, PENDING: 18, CANCELLED: 7 },
        CARDEALER: { COMPLETED: 15, FULFILLED: 15, APPROVED: 25, PENDING: 30, CANCELLED: 15 },
    }[traderType];

    const weights = { ...base };

    if (totalCost > 10000) {
        weights.COMPLETED = Math.max(5, weights.COMPLETED - 15);
        weights.FULFILLED = Math.max(5, weights.FULFILLED - 10);
        weights.PENDING += 10;
        weights.CANCELLED += 10;
    } else if (totalCost < 500) {
        weights.COMPLETED += 10;
        weights.CANCELLED = Math.max(2, weights.CANCELLED - 5);
    }

    if (leadDays > 60) {
        weights.COMPLETED = Math.max(5, weights.COMPLETED - 10);
        weights.PENDING += 8;
        weights.APPROVED += 5;
    } else if (leadDays <= 3) {
        weights.COMPLETED += 8;
        weights.PENDING = Math.max(2, weights.PENDING - 5);
    }

    if (numProducts >= 6) {
        weights.CANCELLED += 5;
        weights.COMPLETED = Math.max(5, weights.COMPLETED - 3);
    }

    return Object.entries(weights).map(([value, weight]) => ({ value, weight }));
};

const writeJSONL = (filename, count, generator) =>
    new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filename);
        const start = performance.now();
        let drainCount = 0;

        const writeNext = (i) => {
            if (i >= count) {
                const elapsed = ((performance.now() - start) / 1000).toFixed(2);
                stream.end(() => {
                    console.log(`✅ ${filename} done — ${count} records in ${elapsed}s (drains: ${drainCount})`);
                    resolve();
                });
                return;
            }

            if (i % 10000 === 0) {
                const elapsed = ((performance.now() - start) / 1000).toFixed(2);
                console.log(`  [${filename}] ${i}/${count} — ${elapsed}s elapsed`);
            }

            const ok = stream.write(JSON.stringify(generator()) + "\n");

            if (!ok) {
                drainCount++;
                stream.once('drain', () => setImmediate(() => writeNext(i + 1)));
            } else {
                setImmediate(() => writeNext(i + 1));
            }
        };

        stream.on('error', reject);
        writeNext(0);
    });

const getDerivedDateFeatures = (date) => {
    return {
        "day-of-week": date.getDay(),
        "month": date.getMonth() + 1,
        "quarter": Math.ceil((date.getMonth() + 1) / 3)
    };
};

const genUser = () => {
    const id = faker.string.uuid();
    pools.userIds.push(id);
    pools.userOrders[id] = [];

    return {
        "doc-type": "user",
        "id": id,
        "name": faker.person.firstName(),
        "surname": faker.person.lastName(),
        "email": faker.internet.email(),
        "orders-ids": [],
        "deleted": false
    };
};

const genTrader = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);

    pools.traderIds.push(id);
    pools.traderReceipts[id] = [];
    pools.traderProducts[id] = [];

    pools.traderTypeMap[id] = traderType;
    if (!pools.tradersByType[traderType]) {
        pools.tradersByType[traderType] = [];
    }
    pools.tradersByType[traderType].push(id);

    if (!pools.productsByTrader[traderType]) {
        pools.productsByTrader[traderType] = [];
    }

    return {
        "doc-type": "trader",
        "id": id,
        "name": faker.company.name(),
        "email": faker.internet.email(),
        "trader-type": traderType,
        "vat": "VAT-" + faker.string.alphanumeric(8).toUpperCase(),
        "products-available": [],
        "receipts-ids": [],
        "deleted": false
    };
};

const genProduct = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);
    const productName = `${category.name} ${faker.commerce.productAdjective()}`;

    const price = parseFloat(faker.number.float({
        min: category.priceRange[0],
        max: category.priceRange[1],
        fractionDigits: 2
    }));

    pools.productIds.push(id);
    pools.productPrices[id] = price;
    pools.productTraderType[id] = traderType;

    if (!pools.productsByTrader[traderType]) {
        pools.productsByTrader[traderType] = [];
    }
    pools.productsByTrader[traderType].push(id);

    const product = {
        "doc-type": "product",
        "id": id,
        "name": productName,
        "price": price,
        "quantity": faker.number.int({ min: 50, max: 1000 }),
        "trader-type": traderType,
        "deleted": false
    };

    if (category.expiry) {
        const isNearExpiry = Math.random() < 0.2;
        product["expiry-date"] = faker.date.between({
            from: isNearExpiry ? '2026-03-15' : '2026-04-15',
            to: isNearExpiry ? '2026-04-14' : '2027-12-31'
        }).toISOString();
    } else {
        product["expiry-date"] = null;
    }

    return product;
};

const genOrder = () => {
    const id = faker.string.uuid();
    const userId = faker.helpers.arrayElement(pools.userIds);

    pools.orderIds.push(id);
    pools.userOrders[userId].push(id);
    pools.orderReceipts[id] = [];
    pools.orderUsers = pools.orderUsers || {};
    pools.orderUsers[id] = userId;

    const orderDate = faker.date.between({ from: '2024-01-01', to: '2026-01-28' });
    pools.orderDates[id] = orderDate;

    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    pools.orderTraderTypes[id] = traderType;

    const profile = FULFILLMENT_PROFILES[traderType];
    const leadDays = faker.number.int({ min: profile.minLeadDays, max: profile.maxLeadDays });
    const expectedFulfillmentDate = new Date(orderDate.getTime() + leadDays * 24 * 60 * 60 * 1000);

    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 10, value: 1 },
        { weight: 15, value: 2 },
        { weight: 20, value: 3 },
        { weight: 18, value: 4 },
        { weight: 15, value: 5 },
        { weight: 10, value: 6 },
        { weight: 7, value: 7 },
        { weight: 5, value: 8 }
    ]);

    const availableProducts = pools.productsByTrader[traderType] || pools.productIds;
    const selectedProducts = new Set();
    const products = [];
    let totalCost = 0;

    for (let i = 0; i < numProducts; i++) {
        let productId;
        let attempts = 0;
        do {
            productId = faker.helpers.arrayElement(availableProducts);
            attempts++;
        } while (selectedProducts.has(productId) && attempts < 10);

        if (!selectedProducts.has(productId)) {
            selectedProducts.add(productId);
            const quantity = faker.helpers.weightedArrayElement([
                { weight: 40, value: 1 },
                { weight: 30, value: 2 },
                { weight: 15, value: 3 },
                { weight: 10, value: 4 },
                { weight: 5, value: 5 }
            ]);
            products.push({ "product_id": productId, "quantity": quantity });

            const price = pools.productPrices[productId] || 0;
            totalCost += price * quantity;
        }
    }

    totalCost = parseFloat(totalCost.toFixed(2));

    const dateFeatures = getDerivedDateFeatures(orderDate);

    const statusWeights = computeStatusWeights(traderType, totalCost, leadDays, products.length);
    const status = faker.helpers.weightedArrayElement(statusWeights);

    return {
        "doc-type": "order",
        "id": id,
        "user-id": userId,
        "trader-type": traderType,
        "status": status,
        "created-date": orderDate.toISOString(),
        "day-of-week": dateFeatures["day-of-week"],
        "month": dateFeatures["month"],
        "quarter": dateFeatures["quarter"],
        "expected-fulfillment-date": expectedFulfillmentDate.toISOString(),
        "lead-days": leadDays,
        "products": products,
        "num-products": products.length,
        "receipts-ids": [],
        "total-cost": totalCost,
        "deleted": false
    };
};

const genReceipt = () => {
    const receiptId = faker.string.uuid();

    const orderId = faker.helpers.arrayElement(pools.orderIds);
    const userId = pools.orderUsers?.[orderId] || faker.helpers.arrayElement(pools.userIds);

    const orderTraderType = pools.orderTraderTypes[orderId];
    const tradersOfType = pools.tradersByType[orderTraderType] || pools.traderIds;
    const traderId = faker.helpers.arrayElement(tradersOfType);

    pools.traderReceipts[traderId].push(receiptId);
    pools.orderReceipts[orderId].push(receiptId);

    const orderDate = pools.orderDates[orderId] || new Date('2025-01-01');

    const profile = FULFILLMENT_PROFILES[orderTraderType];
    const minReceiptDate = new Date(orderDate.getTime() + profile.minLeadDays * 24 * 60 * 60 * 1000);
    const maxReceiptDate = new Date(orderDate.getTime() + profile.maxLeadDays * 24 * 60 * 60 * 1000);
    const receiptDate = faker.date.between({ from: minReceiptDate, to: maxReceiptDate });

    const status = faker.helpers.weightedArrayElement([
        { weight: 85, value: "COMPLETED" },
        { weight: 10, value: "IN_PROGRESS" },
        { weight: 5, value: "CANCELLED" }
    ]);

    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 15, value: 1 },
        { weight: 25, value: 2 },
        { weight: 25, value: 3 },
        { weight: 20, value: 4 },
        { weight: 10, value: 5 },
        { weight: 5, value: 6 }
    ]);

    const availableProducts = pools.productsByTrader[orderTraderType] || pools.productIds;
    const selectedProducts = new Set();
    const products = [];
    let totalCost = 0;

    for (let i = 0; i < numProducts; i++) {
        let productId;
        let attempts = 0;
        do {
            productId = faker.helpers.arrayElement(availableProducts);
            attempts++;
        } while (selectedProducts.has(productId) && attempts < 10);

        if (!selectedProducts.has(productId)) {
            selectedProducts.add(productId);
            const quantity = faker.helpers.weightedArrayElement([
                { weight: 45, value: 1 },
                { weight: 30, value: 2 },
                { weight: 15, value: 3 },
                { weight: 7, value: 4 },
                { weight: 3, value: 5 }
            ]);
            products.push({ "product_id": productId, "quantity": quantity });

            const price = pools.productPrices[productId] || 0;
            totalCost += price * quantity;

            pools.traderProducts[traderId].push({
                "product_id": productId,
                "quantity": faker.number.int({ min: 10, max: 500 })
            });
        }
    }

    totalCost = parseFloat(totalCost.toFixed(2));

    const dateFeatures = getDerivedDateFeatures(receiptDate);

    const receipt = {
        "doc-type": "receipt",
        "id": receiptId,
        "trader-id": traderId,
        "user-id": userId,
        "order-id": orderId,
        "trader-type": orderTraderType,
        "products": products,
        "num-products": products.length,
        "date": receiptDate.toISOString(),
        "day-of-week": dateFeatures["day-of-week"],
        "month": dateFeatures["month"],
        "quarter": dateFeatures["quarter"],
        "total-cost": totalCost,
        "status": status,
        "deleted": false
    };

    if (status === "CANCELLED") {
        const cancelledDate = new Date(receiptDate.getTime() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000);
        receipt["cancelled-date"] = cancelledDate.toISOString();
        receipt["cancelled-by"] = faker.helpers.arrayElement([userId, traderId]);
    } else {
        receipt["cancelled-date"] = null;
        receipt["cancelled-by"] = null;
    }

    return receipt;
};

const rewriteJSONL = (filename, transform) =>
    new Promise((resolve) => {
        const records = [];
        const stream  = fs.createReadStream(filename, "utf8");
        let buffer = "";

        const processLine = (line) => {
            if (!line.trim()) return;
            records.push(transform(JSON.parse(line)));
        };

        stream.on("data", (chunk) => {
            buffer += chunk;
            const lines = buffer.split("\n");
            buffer = lines.pop();
            lines.forEach(processLine);
        });

        stream.on("end", () => {
            processLine(buffer);
            const out = fs.createWriteStream(filename);
            records.forEach((r) => out.write(JSON.stringify(r) + "\n"));
            out.end(() => {
                console.log(`Updated ${filename} with relationships`);
                resolve();
            });
        });
    });

export const updateUsersWithRelationships = () => {
    console.log("Updating users with order and request IDs...");
    return rewriteJSONL("./users.jsonl", (user) => ({
        ...user,
        "orders-ids":   pools.userOrders[user.id]   ?? [],
    }));
};

export const updateTradersWithRelationships = () => {
    console.log("Updating traders with product, receipt IDs...");
    return rewriteJSONL("./traders.jsonl", (trader) => {
        const productMap = new Map();
        for (const p of pools.traderProducts[trader.id] ?? []) {
            if (productMap.has(p.product_id)) {
                productMap.get(p.product_id).quantity += p.quantity;
            } else {
                productMap.set(p.product_id, { ...p });
            }
        }
        return {
            ...trader,
            "products-available": Array.from(productMap.values()),
            "receipts-ids":       pools.traderReceipts[trader.id]  ?? [],
        };
    });
};

export const updateOrdersWithReceipts = () => {
    console.log("Updating orders with receipt IDs...");
    return rewriteJSONL("./orders.jsonl", (order) => ({
        ...order,
        "receipts-ids": pools.orderReceipts[order.id] ?? [],
    }));
};

const runAll = async () => {
    console.log("Starting generation...");
    await writeJSONL('users.jsonl', COUNTS.users, genUser);
    await writeJSONL('traders.jsonl', COUNTS.traders, genTrader);
    await writeJSONL('products.jsonl', COUNTS.products, genProduct);
    await writeJSONL('orders.jsonl', COUNTS.orders, genOrder);
    await writeJSONL('receipts.jsonl', COUNTS.receipts, genReceipt);

    await updateUsersWithRelationships();
    await updateTradersWithRelationships();
    await updateOrdersWithReceipts();
    console.log("✅ All data generated successfully with relationships!");
};

runAll();