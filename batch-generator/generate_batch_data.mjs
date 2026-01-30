import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import fs from "fs";

const COUNTS = {
    users: 50000,
    traders: 5000,
    products: 20000,
    orders: 500000,
    receipts: 500000,
    requests: 100000
};

const pools = {
    userIds: [],
    traderIds: [],
    productIds: [],
    orderIds: [],
    productsByTrader: {}, // Map trader types to their products
    // Relationship tracking
    userOrders: {}, // userId -> [orderIds]
    userRequests: {}, // userId -> [requestIds]
    traderReceipts: {}, // traderId -> [receiptIds]
    traderRequests: {}, // traderId -> [requestIds]
    traderProducts: {}, // traderId -> [productInventory]
    orderReceipts: {} // orderId -> [receiptIds]
};

// Realistic product categories by trader type
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
        { name: 'Akumulator', priceRange: [8000, 25000], expiry: false },
        { name: 'Starter', priceRange: [10000, 30000], expiry: false },
        { name: 'Alternator', priceRange: [15000, 40000], expiry: false }
    ]
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
    pools.userOrders[id] = [];
    pools.userRequests[id] = [];
    
    return {
        "doc-type": "user", 
        "id": id, 
        "name": faker.person.firstName(),
        "surname": faker.person.lastName(), 
        "email": faker.internet.email(),
        "balance": parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })), 
        "orders-ids": [],
        "requests-ids": [],
        "deleted": false
    };
};

const genTrader = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"]);
    
    pools.traderIds.push(id);
    pools.traderReceipts[id] = [];
    pools.traderRequests[id] = [];
    pools.traderProducts[id] = [];
    
    // Initialize product list for this trader type if not exists
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
        "products-available": [], // Will be populated when linking products
        "receipts-ids": [],
        "requests-ids": [],
        "balance": 0, 
        "deleted": false
    };
};

const genProduct = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"]);
    const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);
    
    // Generate product with brand/variant
    const productName = `${category.name} ${faker.commerce.productAdjective()}`;
    
    pools.productIds.push(id);
    
    // Track which trader type this product belongs to
    if (!pools.productsByTrader[traderType]) {
        pools.productsByTrader[traderType] = [];
    }
    pools.productsByTrader[traderType].push(id);
    
    const product = {
        "doc-type": "product", 
        "id": id, 
        "name": productName,
        "price": parseFloat(faker.number.float({ 
            min: category.priceRange[0], 
            max: category.priceRange[1],
            fractionDigits: 2 
        })),
        "quantity": faker.number.int({ min: 50, max: 1000 }),
        "trader-type": traderType,
        "deleted": !category.expiry // If no expiry date, mark as deleted
    };
    
    // Add expiry date only for perishable products
    if (category.expiry) {
        product["expiry-date"] = faker.date.between({ 
            from: '2026-02-01', 
            to: '2027-12-31' 
        }).toISOString();
    }
    
    return product;
};

const genOrder = () => {
    const id = faker.string.uuid();
    const userId = faker.helpers.arrayElement(pools.userIds);
    
    pools.orderIds.push(id);
    pools.userOrders[userId].push(id);
    pools.orderReceipts[id] = [];
    
    const orderDate = faker.date.between({ from: '2024-01-01', to: '2026-01-28' });
    const status = faker.helpers.arrayElement(["PENDING", "APPROVED", "FULFILLED", "CANCELLED"]);
    
    // Generate 1-8 products per order (weighted towards fewer items)
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
    
    // Pick products from the same trader type for realism
    const traderType = faker.helpers.arrayElement(["SUPERMARKET", "PHARMACY", "GROCERY", "CARDEALER"]);
    const availableProducts = pools.productsByTrader[traderType] || pools.productIds;
    
    // Generate unique products for this order
    const selectedProducts = new Set();
    const products = [];
    
    for (let i = 0; i < numProducts; i++) {
        let productId;
        let attempts = 0;
        
        // Try to get a unique product (max 10 attempts)
        do {
            productId = faker.helpers.arrayElement(availableProducts);
            attempts++;
        } while (selectedProducts.has(productId) && attempts < 10);
        
        if (!selectedProducts.has(productId)) {
            selectedProducts.add(productId);
            
            // Quantity weighted towards smaller amounts
            const quantity = faker.helpers.weightedArrayElement([
                { weight: 40, value: 1 },
                { weight: 30, value: 2 },
                { weight: 15, value: 3 },
                { weight: 10, value: 4 },
                { weight: 5, value: 5 }
            ]);
            
            products.push({
                "product-id": productId,
                "quantity": quantity
            });
        }
    }
    
    // Calculate realistic total cost (base + slight variation)
    const baseCost = products.length * faker.number.float({ min: 200, max: 800, fractionDigits: 2 });
    const totalCost = parseFloat(baseCost.toFixed(2));
    
    return {
        "doc-type": "order", 
        "id": id,
        "user-id": userId,
        "status": status,
        "created-date": orderDate.toISOString(),
        "products": products,
        "receipts-ids": [],
        "total-cost": totalCost,
        "request-id": "",
        "deleted": false
    };
};

const genReceipt = () => {
    const receiptId = faker.string.uuid();
    const userId = faker.helpers.arrayElement(pools.userIds);
    const orderId = faker.helpers.arrayElement(pools.orderIds);
    const traderId = faker.helpers.arrayElement(pools.traderIds);
    
    // Track relationships
    pools.traderReceipts[traderId].push(receiptId);
    pools.orderReceipts[orderId].push(receiptId);
    
    const receiptDate = faker.date.between({ from: '2024-01-01', to: '2026-01-28' });
    const status = faker.helpers.weightedArrayElement([
        { weight: 85, value: "COMPLETED" },
        { weight: 10, value: "IN_PROGRESS" },
        { weight: 5, value: "CANCELLED" }
    ]);
    
    // Generate 1-6 products per receipt (weighted towards fewer items)
    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 15, value: 1 },
        { weight: 25, value: 2 },
        { weight: 25, value: 3 },
        { weight: 20, value: 4 },
        { weight: 10, value: 5 },
        { weight: 5, value: 6 }
    ]);
    
    const selectedProducts = new Set();
    const products = [];
    
    for (let i = 0; i < numProducts; i++) {
        let productId;
        let attempts = 0;
        
        do {
            productId = faker.helpers.arrayElement(pools.productIds);
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
            
            products.push({
                "product-id": productId,
                "quantity": quantity
            });
            
            // Track products for trader
            pools.traderProducts[traderId].push({
                "product-id": productId,
                "quantity": faker.number.int({ min: 10, max: 500 })
            });
        }
    }
    
    const baseCost = products.length * faker.number.float({ min: 150, max: 700, fractionDigits: 2 });
    const totalCost = parseFloat(baseCost.toFixed(2));
    
    const receipt = {
        "doc-type": "receipt", 
        "id": receiptId,
        "trader-id": traderId,
        "user-id": userId,
        "order-id": orderId,
        "products": products,
        "date": receiptDate.toISOString(),
        "total-cost": totalCost,
        "status": status,
        "deleted": false
    };
    
    // Add cancellation details if cancelled
    if (status === "CANCELLED") {
        receipt["cancelled-date"] = faker.date.between({ 
            from: receiptDate, 
            to: '2026-01-28' 
        }).toISOString();
        receipt["cancelled-by"] = faker.helpers.arrayElement([userId, traderId]);
    } else {
        receipt["cancelled-date"] = "";
        receipt["cancelled-by"] = "";
    }
    
    return receipt;
};

const genRequest = () => {
    const requestId = faker.string.uuid();
    const userId = faker.helpers.arrayElement(pools.userIds);
    const traderId = faker.helpers.arrayElement(pools.traderIds);
    
    // Track relationships
    pools.userRequests[userId].push(requestId);
    pools.traderRequests[traderId].push(requestId);
    
    const createdDate = faker.date.between({ from: '2024-01-01', to: '2026-01-28' });
    const status = faker.helpers.weightedArrayElement([
        { weight: 5, value: "CREATED" },
        { weight: 10, value: "PENDING_FUNDS" },
        { weight: 45, value: "APPROVED" },
        { weight: 5, value: "REJECTED" },
        { weight: 3, value: "EXPIRED" },
        { weight: 30, value: "FULFILLED" },
        { weight: 2, value: "CANCELED" }
    ]);
    
    // Generate 1-10 products per request
    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 8, value: 1 },
        { weight: 12, value: 2 },
        { weight: 15, value: 3 },
        { weight: 18, value: 4 },
        { weight: 16, value: 5 },
        { weight: 12, value: 6 },
        { weight: 9, value: 7 },
        { weight: 6, value: 8 },
        { weight: 3, value: 9 },
        { weight: 1, value: 10 }
    ]);
    
    const selectedProducts = new Set();
    const products = [];
    
    for (let i = 0; i < numProducts; i++) {
        let productId;
        let attempts = 0;
        
        do {
            productId = faker.helpers.arrayElement(pools.productIds);
            attempts++;
        } while (selectedProducts.has(productId) && attempts < 10);
        
        if (!selectedProducts.has(productId)) {
            selectedProducts.add(productId);
            
            const quantity = faker.number.int({ min: 1, max: 10 });
            
            products.push({
                "product-id": productId,
                "quantity": quantity
            });
        }
    }
    
    const baseCost = products.reduce((sum, p) => sum + (p.quantity * 300), 0);
    const totalCost = parseFloat(faker.number.float({ 
        min: baseCost * 0.8, 
        max: baseCost * 1.2,
        fractionDigits: 2 
    }).toFixed(2));
    
    // Due date is 7-30 days after creation
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 7, max: 30 }));
    
    return {
        "doc-type": "product-request", 
        "id": requestId,
        "user-id": userId,
        "trader-id": traderId,
        "user-email": faker.internet.email(),
        "products": products,
        "created-date": createdDate.toISOString(),
        "due-date": dueDate.toISOString(),
        "total-cost": totalCost,
        "status": status,
        "order-id": status === "FULFILLED" ? faker.helpers.arrayElement(pools.orderIds) : "",
        "deleted": false
    };
};

// Update entities with relationship IDs
const updateUsersWithRelationships = () => {
    console.log("Updating users with order and request IDs...");
    const users = [];
    const usersStream = fs.createReadStream('users.jsonl', 'utf8');
    let buffer = '';
    
    return new Promise((resolve) => {
        usersStream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            lines.forEach(line => {
                if (line.trim()) {
                    const user = JSON.parse(line);
                    user['orders-ids'] = pools.userOrders[user.id] || [];
                    user['requests-ids'] = pools.userRequests[user.id] || [];
                    users.push(user);
                }
            });
        });
        
        usersStream.on('end', () => {
            if (buffer.trim()) {
                const user = JSON.parse(buffer);
                user['orders-ids'] = pools.userOrders[user.id] || [];
                user['requests-ids'] = pools.userRequests[user.id] || [];
                users.push(user);
            }
            
            const stream = fs.createWriteStream('users.jsonl');
            users.forEach(user => stream.write(JSON.stringify(user) + '\n'));
            stream.end();
            console.log(`Updated users.jsonl with relationships`);
            resolve();
        });
    });
};

const updateTradersWithRelationships = () => {
    console.log("Updating traders with product, receipt, and request IDs...");
    const traders = [];
    const tradersStream = fs.createReadStream('traders.jsonl', 'utf8');
    let buffer = '';
    
    return new Promise((resolve) => {
        tradersStream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            lines.forEach(line => {
                if (line.trim()) {
                    const trader = JSON.parse(line);
                    
                    // Consolidate products and remove duplicates
                    const productMap = new Map();
                    (pools.traderProducts[trader.id] || []).forEach(p => {
                        if (productMap.has(p['product-id'])) {
                            productMap.get(p['product-id']).quantity += p.quantity;
                        } else {
                            productMap.set(p['product-id'], { ...p });
                        }
                    });
                    
                    trader['products-available'] = Array.from(productMap.values());
                    trader['receipts-ids'] = pools.traderReceipts[trader.id] || [];
                    trader['requests-ids'] = pools.traderRequests[trader.id] || [];
                    traders.push(trader);
                }
            });
        });
        
        tradersStream.on('end', () => {
            if (buffer.trim()) {
                const trader = JSON.parse(buffer);
                const productMap = new Map();
                (pools.traderProducts[trader.id] || []).forEach(p => {
                    if (productMap.has(p['product-id'])) {
                        productMap.get(p['product-id']).quantity += p.quantity;
                    } else {
                        productMap.set(p['product-id'], { ...p });
                    }
                });
                trader['products-available'] = Array.from(productMap.values());
                trader['receipts-ids'] = pools.traderReceipts[trader.id] || [];
                trader['requests-ids'] = pools.traderRequests[trader.id] || [];
                traders.push(trader);
            }
            
            const stream = fs.createWriteStream('traders.jsonl');
            traders.forEach(trader => stream.write(JSON.stringify(trader) + '\n'));
            stream.end();
            console.log(`Updated traders.jsonl with relationships`);
            resolve();
        });
    });
};

const updateOrdersWithReceipts = () => {
    console.log("Updating orders with receipt IDs...");
    const orders = [];
    const ordersStream = fs.createReadStream('orders.jsonl', 'utf8');
    let buffer = '';
    
    return new Promise((resolve) => {
        ordersStream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            lines.forEach(line => {
                if (line.trim()) {
                    const order = JSON.parse(line);
                    order['receipts-ids'] = pools.orderReceipts[order.id] || [];
                    orders.push(order);
                }
            });
        });
        
        ordersStream.on('end', () => {
            if (buffer.trim()) {
                const order = JSON.parse(buffer);
                order['receipts-ids'] = pools.orderReceipts[order.id] || [];
                orders.push(order);
            }
            
            const stream = fs.createWriteStream('orders.jsonl');
            orders.forEach(order => stream.write(JSON.stringify(order) + '\n'));
            stream.end();
            console.log(`Updated orders.jsonl with relationships`);
            resolve();
        });
    });
};

console.log("Starting generation...");
console.log("Generating users...");
writeJSONL('users.jsonl', COUNTS.users, genUser);

console.log("Generating traders...");
writeJSONL('traders.jsonl', COUNTS.traders, genTrader);

console.log("Generating products...");
writeJSONL('products.jsonl', COUNTS.products, genProduct);

setTimeout(() => {
    console.log("Generating orders...");
    writeJSONL('orders.jsonl', COUNTS.orders, genOrder);
    
    console.log("Generating product requests...");
    writeJSONL('order_requests.jsonl', COUNTS.requests, genRequest);
    
    setTimeout(() => {
        console.log("Generating receipts...");
        writeJSONL('receipts.jsonl', COUNTS.receipts, genReceipt);
        
        // Update all entities with their relationships
        setTimeout(async () => {
            await updateUsersWithRelationships();
            await updateTradersWithRelationships();
            await updateOrdersWithReceipts();
            console.log("✅ All data generated successfully with relationships!");
        }, 500);
    }, 200);
}, 200);