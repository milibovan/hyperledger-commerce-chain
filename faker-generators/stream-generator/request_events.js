import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator';
import { EntityTypes, EventTypes, quantity, numProducts } from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';

export const createRequest = async () => {
    const header = genHeader(EventTypes.RequestCreated, EntityTypes.Request);

    const [[, userId], [, productIds], [, traderId]] = await redis
        .pipeline()
        .srandmember('pool:userIds')
        .srandmember('pool:productIds', numProducts)
        .srandmember('pool:traderIds')
        .exec();

    const products = productIds.map(product_id => ({
        product_id,
        quantity: quantity,
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const total_cost = parseFloat(
        products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)
    );

    redis.sadd('pool:requestIds', header.event_id);

    return {
        common: header,
        user_id: userId,
        trader_id: traderId,
        products,
        total_cost,
        due_date: faker.date.future().getTime()
    };
};

export const approveRequest = async () => {
    const header = genHeader(EventTypes.RequestApproved, EntityTypes.Request)

    const traderId = await redis.srandmember('pool:traderIds');

    const requestApprovedEvent = {
        "common": header,
        "trader_id": traderId
    }
    
    return requestApprovedEvent
}

export const cancelRequest = async () => {
    const header = genHeader(EventTypes.RequestCancelled, EntityTypes.Request)

    const userId = await redis.srandmember('pool:userIds');

    const requestCancelledEvent = {
        "common": header,
        "user_id": userId,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return requestCancelledEvent
};

export const fulfillRequest = async () => {
    const header = genHeader(EventTypes.RequestFulfilled, EntityTypes.Request)

    const [[, traderId], [, orderId]] = await redis
        .pipeline()
        .srandmember('pool:traderIds')
        .srandmember('pool:orderIds')
        .exec();

    const requestFulfilledEvent = {
        "common": header,
        "trader_id": traderId,
        "order_id": orderId
    }
    
    return requestFulfilledEvent
};

export const expireRequest = async () => {
    const header = genHeader(EventTypes.RequestExpired, EntityTypes.Request);

    return {
        common: header,
        due_date: faker.date.past().getTime()
    };
};

export const pendingRequest = async () => {
    const header = genHeader(EventTypes.RequestPending, EntityTypes.Request);

    return {
        common: header
    };
};

export const rejectRequest = async () => {
    const header = genHeader(EventTypes.RequestRejected, EntityTypes.Request)

    const traderId = await redis.srandmember('pool:traderIds');

    const requestRejectedEvent = {
        "common": header,
        "trader_id": traderId,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return requestRejectedEvent
};