import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator.js';
import { EntityTypes, EventTypes, numProducts, OrderStatus, RequestStatus } from '../batch-generator/constants.js';
import { redis, moveEntityStatus } from '../batch-generator/pools.js';

export const createOrder = async () => {
    const header = genHeader(EventTypes.OrderCreated, EntityTypes.Order);
    const includeRequest = Math.random() >= 0.5;

    const [[, userId], [, productIds], [, requestIds]] = await redis
        .pipeline()
        .srandmember('pool:userIds')
        .srandmember('pool:productIds', numProducts)
        .srandmember(`pool:requestIds:${RequestStatus.FULFILLED}`, includeRequest ? 1 : 0)
        .exec();

    const products = productIds.map(product_id => ({
        product_id,
        quantity: faker.number.int({ min: 1, max: 5 }),
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const total_cost = parseFloat(
        products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)
    );

    await redis.sadd(`pool:orderIds:${OrderStatus.CREATED}`, header.entity_id);

    ;

    return {
        common: header,
        user_id: userId,
        products,
        total_cost,
        request_id: requestIds?.[0] ?? ''
    };
};

export const approveOrder = async () => {
    const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.CREATED}`);
    if (!orderId) return null;

    const header = genHeader(EventTypes.OrderApproved, EntityTypes.Order, orderId);
    const traderId = await redis.srandmember('pool:traderIds');

    await moveEntityStatus(orderId, 'order', OrderStatus.CREATED, OrderStatus.APPROVED);

    ;

    return {
        common: header,
        order_id: orderId,
        trader_id: traderId
    };
};

export const cancelOrder = async () => {
    const [[, createdId], [, approvedId]] = await redis
        .pipeline()
        .srandmember(`pool:orderIds:${OrderStatus.CREATED}`)
        .srandmember(`pool:orderIds:${OrderStatus.APPROVED}`)
        .exec();

    const orderId = createdId || approvedId;
    if (!orderId) return null;

    const fromStatus = createdId ? OrderStatus.CREATED : OrderStatus.APPROVED;
    const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order, orderId);
    const userId = await redis.srandmember('pool:userIds');

    await moveEntityStatus(orderId, 'order', fromStatus, OrderStatus.CANCELLED);
    
    ;

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

    await moveEntityStatus(orderId, 'order', OrderStatus.APPROVED, OrderStatus.FULFILLED);
    
    ;

    return {
        common: header,
        order_id: orderId,
        trader_id: traderId,
        products,
        reason: Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    };
};

export const completeOrder = async () => {
    const orderId = await redis.srandmember(`pool:orderIds:${OrderStatus.FULFILLED}`);
    if (!orderId) return null;

    const header = genHeader(EventTypes.OrderCompleted, EntityTypes.Order, orderId);
    const receiptCount = faker.number.int({ min: 1, max: 6 });
    const receiptIds = await redis.srandmember(`pool:receiptIds:${ReceiptStatus.CREATED}`, receiptCount);

    await moveEntityStatus(orderId, 'order', OrderStatus.FULFILLED, OrderStatus.COMPLETED);
    
    ;

    return {
        common: header,
        order_id: orderId,
        receipt_ids: receiptIds ?? []
    };
};