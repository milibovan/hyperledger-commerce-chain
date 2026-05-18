import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event_header_generator.js';
import { EntityTypes, EventTypes, numProducts, OrderStatus, RequestStatus, ReceiptStatus } from '../batch-generator/constants.js';
import { redis } from '../batch-generator/pools.js';
import { moveEntityStatus } from '../batch-generator/utils.js';

export const createOrder = async (overrides = {}) => {
    const header = genHeader(EventTypes.OrderCreated, EntityTypes.Order);
    const includeRequest = Math.random() >= 0.5;

    const [[, randomUserId], [, productIds], [, requestIds]] = await redis
        .pipeline()
        .srandmember('pool:userIds')
        .srandmember('pool:productIds', numProducts)
        .srandmember(`pool:requestIds:${RequestStatus.FULFILLED}`, includeRequest ? 1 : 0)
        .exec();

    const userId = overrides.user_id ?? randomUserId;

    const products = productIds.map(product_id => ({
        product_id,
        quantity: faker.number.int({ min: 1, max: 5 }),
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const total_cost = parseFloat(
        products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)
    );

    await redis
        .pipeline()
        .sadd(`pool:orderIds:${OrderStatus.CREATED}`, header.entity_id)
        .sadd(`pool:userOrderIds:${userId}:${OrderStatus.CREATED}`, header.entity_id)
        .exec();

    return { common: header, user_id: userId, products, total_cost, request_id: requestIds?.[0] ?? '' };
};

export const approveOrder = async () => {
    const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.CREATED}`);
    if (!orderId) return null;

    const header = genHeader(EventTypes.OrderApproved, EntityTypes.Order, orderId);
    const traderId = await redis.srandmember('pool:traderIds');

    await moveEntityStatus(orderId, 'order', OrderStatus.CREATED, OrderStatus.APPROVED);

    return {
        common: header,
        order_id: orderId,
        trader_id: traderId
    };
};

export const cancelOrder = async (overrides = {}) => {
    const targetUserId = overrides.user_id ?? null;

    let orderId, fromStatus;

    if (targetUserId) {
        const [[, createdId], [, approvedId]] = await redis
            .pipeline()
            .srandmember(`pool:userOrderIds:${targetUserId}:${OrderStatus.CREATED}`)
            .srandmember(`pool:userOrderIds:${targetUserId}:${OrderStatus.APPROVED}`)
            .exec();

        orderId = createdId || approvedId;
        fromStatus = createdId ? OrderStatus.CREATED : OrderStatus.APPROVED;
    }

    if (!orderId) {
        const [[, createdId], [, approvedId]] = await redis
            .pipeline()
            .srandmember(`pool:orderIds:${OrderStatus.CREATED}`)
            .srandmember(`pool:orderIds:${OrderStatus.APPROVED}`)
            .exec();

        orderId = createdId || approvedId;
        fromStatus = createdId ? OrderStatus.CREATED : OrderStatus.APPROVED;
    }

    if (!orderId) return null;

    const userId = targetUserId ?? await redis.srandmember('pool:userIds');
    const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order, orderId);

    await redis
        .pipeline()
        .smove(`pool:orderIds:${fromStatus}`, `pool:orderIds:${OrderStatus.CANCELLED}`, orderId)
        .srem(`pool:userOrderIds:${userId}:${fromStatus}`, orderId)
        .sadd(`pool:userOrderIds:${userId}:${OrderStatus.CANCELLED}`, orderId)
        .exec();

    return {
        common: header,
        order_id: orderId,
        user_id: userId,
        reason: Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    };
};

export const fulfillOrder = async () => {
    const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.APPROVED}`);
    if (!orderId) return null;

    const header = genHeader(EventTypes.OrderFulfilled, EntityTypes.Order, orderId);

    const [[, traderId], [, productIds]] = await redis
        .pipeline()
        .srandmember('pool:traderIds')
        .srandmember('pool:productIds', numProducts)
        .exec();

    const products = productIds.map(product_id => ({
        product_id,
        quantity: faker.number.int({ min: 1, max: 5 }),
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const receiptCount = faker.number.int({ min: 1, max: 6 });
    const receiptIds = Array.from({ length: receiptCount }, () => faker.string.uuid());

    const pipeline = redis.pipeline();

    pipeline.sadd(`pool:orderReceiptIds:${orderId}`, ...receiptIds);
    pipeline.expire(`pool:orderReceiptIds:${orderId}`, 3600);

    receiptIds.forEach(id => {
        pipeline.sadd(`pool:receiptIds:${ReceiptStatus.CREATED}`, id);
    });

    pipeline.smove(
        `pool:orderIds:${OrderStatus.APPROVED}`,
        `pool:orderIds:${OrderStatus.FULFILLED}`,
        orderId
    );

    await pipeline.exec();

    return {
        common: header,
        trader_id: traderId,
        products
    };
};

export const completeOrder = async () => {
    const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.FULFILLED}`);
    if (!orderId) return null;

    const receiptIds = await redis.smembers(`pool:orderReceiptIds:${orderId}`);
    if (!receiptIds || receiptIds.length === 0) return null;

    const userId = await redis.srandmember('pool:userIds');
    const header = genHeader(EventTypes.OrderCompleted, EntityTypes.Order, orderId);

    const pipeline = redis.pipeline();
    pipeline.del(`pool:orderReceiptIds:${orderId}`); // clean up
    pipeline.smove(
        `pool:orderIds:${OrderStatus.FULFILLED}`,
        `pool:orderIds:${OrderStatus.COMPLETED}`,
        orderId
    );
    await pipeline.exec();

    return {
        common: header,
        user_id: userId,
        receipt_ids: receiptIds
    };
};