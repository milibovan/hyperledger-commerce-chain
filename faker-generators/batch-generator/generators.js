import { fakerSR_RS_latin as faker } from "@faker-js/faker";
import {
    TRADER_TYPES,
    FULFILLMENT_PROFILES,
    PRODUCT_CATEGORIES,
    VERSATILE_RECEIPT_RATIO,
} from "./constants.js";
import { pools } from "./pools.js";

export const genUser = () => {
    const id = faker.string.uuid();
    pools.userIds.push(id);
    pools.userOrders[id] = [];
    pools.userRequests[id] = [];

    return {
        "doc-type": "user",
        id,
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        balance: parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),
        "orders-ids": [],
        "requests-ids": [],
        deleted: false,
    };
};

export const genTrader = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);

    pools.traderIds.push(id);
    pools.traderReceipts[id] = [];
    pools.traderRequests[id] = [];
    pools.traderProducts[id] = [];
    pools.traderTypeMap[id] = traderType;

    pools.tradersByType[traderType] ??= [];
    pools.tradersByType[traderType].push(id);

    pools.productsByTrader[traderType] ??= [];

    return {
        "doc-type": "trader",
        id,
        name: faker.company.name(),
        email: faker.internet.email(),
        "trader-type": traderType,
        vat: "VAT-" + faker.string.alphanumeric(8).toUpperCase(),
        "products-available": [],
        "receipts-ids": [],
        "requests-ids": [],
        balance: 0,
        deleted: false,
    };
};

export const genProduct = () => {
    const id = faker.string.uuid();
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);

    pools.productIds.push(id);
    pools.productsByTrader[traderType] ??= [];
    pools.productsByTrader[traderType].push(id);

    const product = {
        "doc-type": "product",
        id,
        name: `${category.name} ${faker.commerce.productAdjective()}`,
        price: parseFloat(
            faker.number.float({
                min: category.priceRange[0],
                max: category.priceRange[1],
                fractionDigits: 2,
            })
        ),
        quantity: faker.number.int({ min: 50, max: 1000 }),
        "trader-type": traderType,
        deleted: false,
    };

    const isNearExpiry = Math.random() < 0.2;
    product["expiry-date"] = faker.date
        .between({
            from: isNearExpiry ? "2026-03-15" : "2026-04-15",
            to:   isNearExpiry ? "2026-04-14" : "2027-12-31",
        })
        .toISOString();

    return product;
};

export const genOrder = () => {
    const id = faker.string.uuid();
    const userId = faker.helpers.arrayElement(pools.userIds);

    pools.orderIds.push(id);
    pools.userOrders[userId].push(id);
    pools.orderReceipts[id] = [];
    pools.orderUsers[id] = userId;

    const orderDate = faker.date.between({ from: "2024-01-01", to: "2026-01-28" });
    pools.orderDates[id] = orderDate;

    const status = faker.helpers.weightedArrayElement([
        { weight: 30, value: "COMPLETED"  },
        { weight: 30, value: "FULFILLED"  },
        { weight: 20, value: "APPROVED"   },
        { weight: 10, value: "PENDING"    },
        { weight: 10, value: "CANCELLED"  },
    ]);

    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 10, value: 1 },
        { weight: 15, value: 2 },
        { weight: 20, value: 3 },
        { weight: 18, value: 4 },
        { weight: 15, value: 5 },
        { weight: 10, value: 6 },
        { weight:  7, value: 7 },
        { weight:  5, value: 8 },
    ]);

    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    const availableProducts = pools.productsByTrader[traderType] ?? pools.productIds;
    const selectedProducts = new Set();
    const products = [];

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
                { weight:  5, value: 5 },
            ]);
            products.push({ product_id: productId, quantity });
        }
    }

    const totalCost = parseFloat(
        (products.length * faker.number.float({ min: 200, max: 800, fractionDigits: 2 })).toFixed(2)
    );

    return {
        "doc-type": "order",
        id,
        "user-id": userId,
        status,
        "created-date": orderDate.toISOString(),
        products,
        "receipts-ids": [],
        "total-cost": totalCost,
        "request-id": "",
        deleted: false,
    };
};

export const genReceipt = () => {
    const receiptId = faker.string.uuid();
    let userId, traderId;

    // Bias versatile users toward uncovered trader types so they reach >= 3 types.
    if (pools.versatileUserIds && Math.random() < VERSATILE_RECEIPT_RATIO) {
        userId = faker.helpers.arrayElement([...pools.versatileUserIds]);
        pools.versatileUserCoverage[userId] ??= new Set();

        const covered   = pools.versatileUserCoverage[userId];
        const uncovered = TRADER_TYPES.filter((t) => !covered.has(t));
        const targetType = uncovered.length > 0
            ? faker.helpers.arrayElement(uncovered)
            : faker.helpers.arrayElement(TRADER_TYPES);

        traderId = faker.helpers.arrayElement(pools.tradersByType[targetType] ?? pools.traderIds);
        covered.add(pools.traderTypeMap[traderId]);
    } else {
        userId   = faker.helpers.arrayElement(pools.userIds);
        traderId = faker.helpers.arrayElement(pools.traderIds);
    }

    // Align userId with the order's actual owner.
    const userOrdersList = pools.userOrders[userId];
    const orderId = userOrdersList?.length > 0
        ? faker.helpers.arrayElement(userOrdersList)
        : faker.helpers.arrayElement(pools.orderIds);

    const orderOwner = pools.orderUsers?.[orderId];
    if (orderOwner) userId = orderOwner;

    pools.traderReceipts[traderId].push(receiptId);
    pools.orderReceipts[orderId].push(receiptId);

    const orderDate     = pools.orderDates[orderId] ?? new Date("2025-01-01");
    const minReceiptDate = new Date(orderDate.getTime() + 1 * 86_400_000);
    const maxReceiptDate = new Date(orderDate.getTime() + 90 * 86_400_000);
    const receiptDate   = faker.date.between({ from: minReceiptDate, to: maxReceiptDate });

    const status = faker.helpers.weightedArrayElement([
        { weight: 85, value: "COMPLETED"   },
        { weight: 10, value: "IN_PROGRESS" },
        { weight:  5, value: "CANCELLED"   },
    ]);

    const numProducts = faker.helpers.weightedArrayElement([
        { weight: 15, value: 1 },
        { weight: 25, value: 2 },
        { weight: 25, value: 3 },
        { weight: 20, value: 4 },
        { weight: 10, value: 5 },
        { weight:  5, value: 6 },
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
                { weight:  7, value: 4 },
                { weight:  3, value: 5 },
            ]);
            products.push({ product_id: productId, quantity });
            pools.traderProducts[traderId].push({
                product_id: productId,
                quantity: faker.number.int({ min: 10, max: 500 }),
            });
        }
    }

    const totalCost = parseFloat(
        (products.length * faker.number.float({ min: 150, max: 700, fractionDigits: 2 })).toFixed(2)
    );

    const receipt = {
        "doc-type": "receipt",
        id: receiptId,
        "trader-id": traderId,
        "user-id": userId,
        "order-id": orderId,
        products,
        date: receiptDate.toISOString(),
        "total-cost": totalCost,
        status,
        deleted: false,
    };

    if (status === "CANCELLED") {
        const cancelledDate = new Date(
            receiptDate.getTime() +
                faker.number.int({ min: 1, max: 30 }) * 86_400_000
        );
        receipt["cancelled-date"] = cancelledDate.toISOString();
        receipt["cancelled-by"]   = faker.helpers.arrayElement([userId, traderId]);
    } else {
        receipt["cancelled-date"] = "";
        receipt["cancelled-by"]   = "";
    }

    return receipt;
};

export const genRequest = () => {
    const requestId = faker.string.uuid();
    const userId    = faker.helpers.arrayElement(pools.userIds);
    const traderId  = faker.helpers.arrayElement(pools.traderIds);

    pools.userRequests[userId].push(requestId);
    pools.traderRequests[traderId].push(requestId);

    const status = faker.helpers.weightedArrayElement([
        { weight:  5, value: "CREATED"       },
        { weight: 10, value: "PENDING_FUNDS"  },
        { weight: 30, value: "APPROVED"       },
        { weight:  5, value: "REJECTED"       },
        { weight:  3, value: "EXPIRED"        },
        { weight: 45, value: "FULFILLED"      },
        { weight:  2, value: "CANCELED"       },
    ]);

    const numProducts = faker.helpers.weightedArrayElement([
        { weight:  8, value:  1 },
        { weight: 12, value:  2 },
        { weight: 15, value:  3 },
        { weight: 18, value:  4 },
        { weight: 16, value:  5 },
        { weight: 12, value:  6 },
        { weight:  9, value:  7 },
        { weight:  6, value:  8 },
        { weight:  3, value:  9 },
        { weight:  1, value: 10 },
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
            products.push({
                product_id: productId,
                quantity: faker.number.int({ min: 1, max: 10 }),
            });
        }
    }

    const baseCost  = products.reduce((sum, p) => sum + p.quantity * 300, 0);
    const totalCost = parseFloat(
        faker.number
            .float({ min: baseCost * 0.8, max: baseCost * 1.2, fractionDigits: 2 })
            .toFixed(2)
    );

    let fulfilledOrderId = "";
    let createdDate;

    if (status === "FULFILLED") {
        const userOwnedOrders = pools.userOrders[userId];
        fulfilledOrderId = userOwnedOrders?.length > 0
            ? faker.helpers.arrayElement(userOwnedOrders)
            : faker.helpers.arrayElement(pools.orderIds);

        const orderDate = pools.orderDates[fulfilledOrderId];
        if (orderDate) {
            const profile = FULFILLMENT_PROFILES[pools.traderTypeMap[traderId]];
            createdDate = faker.date.between({
                from: new Date(orderDate.getTime() - profile.maxLeadDays * 86_400_000),
                to:   new Date(orderDate.getTime() - profile.minLeadDays * 86_400_000),
            });
        } else {
            createdDate = faker.date.between({ from: "2024-01-01", to: "2026-03-21" });
        }
    } else {
        createdDate = faker.date.between({ from: "2024-01-01", to: "2026-03-28" });
    }

    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 7, max: 30 }));

    return {
        "doc-type": "product-request",
        id: requestId,
        "user-id": userId,
        "trader-id": traderId,
        "user-email": faker.internet.email(),
        products,
        "created-date": createdDate.toISOString(),
        "due-date": dueDate.toISOString(),
        "total-cost": totalCost,
        status,
        "order-id": fulfilledOrderId,
        deleted: false,
    };
};