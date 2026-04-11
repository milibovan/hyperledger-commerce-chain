import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator';
import { EntityTypes, EventTypes, quantity, numProducts } from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';

export const createOrder = async () => {
    const header = genHeader(EventTypes.OrderCreated, EntityTypes.Order);
    const includeRequest = Math.random() >= 0.5;

    const [[, userId], [, productIds], [, requestIds]] = await redis
        .pipeline()
        .srandmember('pool:userIds')
        .srandmember('pool:productIds', numProducts)
        .srandmember('pool:requestIds', includeRequest ? 1 : 0)
        .exec();

    const products = productIds.map(product_id => ({
        product_id,
        quantity: quantity,
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const total_cost = parseFloat(
        products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)
    );

    redis.sadd('pool:orderIds', header.event_id);

    return {
        common: header,
        user_id: userId,
        products,
        total_cost,
        request_id: requestIds?.[0] ?? ''
    };
};

export const approveOrder = async () => {
    const header = genHeader(EventTypes.OrderApproved, EntityTypes.Order)

    const traderId = await redis.srandmember('pool:traderIds');

    const orderApprovedEvent = {
        "common": header,
        "trader_id": traderId
    }
    
    return orderApprovedEvent
}

export const cancelOrder = async () => {
    const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order)

    const userId = await redis.srandmember('pool:userIds');

    const orderCancelledEvent = {
        "common": header,
        "user_id": userId,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return orderCancelledEvent
};

export const completeOrder = async () => {
    const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order)
    const receiptCount = faker.number.int({ min: 1, max: 6 });

    const [[, userId], [, receiptIds]] = await redis
        .pipeline()
        .srandmember('pool:userIds')
        .srandmember('pool:receiptIds', receiptCount)
        .exec();

    const orderCompletedEvent = {
        "common": header,
        "user_id": userId,
        "receipts_ids": receiptIds
    }
    
    return orderCompletedEvent
};

export const fulfillOrder = async () => {
    const header = genHeader(EventTypes.OrderCancelled, EntityTypes.Order)

    const [[, traderId], [, productIds]] = await redis
        .pipeline()
        .srandmember('pool:traderIds')
        .srandmember('pool:productIds', numProducts)
        .exec();

    const products = productIds.map(product_id => ({
        product_id,
        quantity: quantity,
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));


    const orderFulfilledEvent = {
        "common": header,
        "trader_id": traderId,
        "products": products,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return orderFulfilledEvent
};