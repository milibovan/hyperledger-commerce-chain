import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event_header_generator.js';
import { EntityTypes, EventTypes, numProducts, RequestStatus, OrderStatus } from '../batch-generator/constants.js';
import { redis } from '../batch-generator/pools.js';
import { moveEntityStatus } from '../batch-generator/utils.js';

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
        quantity: faker.number.int({ min: 1, max: 5 }),
        price: parseFloat(faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }))
    }));

    const total_cost = parseFloat(
        products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)
    );

    await redis.sadd(`pool:requestIds:${RequestStatus.CREATED}`, header.entity_id);
    
    ;

    return {
        common: header,
        user_id: userId,
        trader_id: traderId,
        products,
        total_cost,
        due_date: faker.date.future().getTime()
    };
};

export const pendingRequest = async () => {
    const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.CREATED}`);
    if (!requestId) return null;

    const header = genHeader(EventTypes.RequestPending, EntityTypes.Request, requestId);

    await moveEntityStatus(requestId, 'request', RequestStatus.CREATED, RequestStatus.PENDING_FUNDS);
    
    ;

    return {
        common: header,
        request_id: requestId
    };
};

export const approveRequest = async () => {
    const [[, createdId], [, pendingId]] = await redis
        .pipeline()
        .srandmember(`pool:requestIds:${RequestStatus.CREATED}`)
        .srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`)
        .exec();

    const requestId = createdId || pendingId;
    if (!requestId) return null;

    const fromStatus = createdId ? RequestStatus.CREATED : RequestStatus.PENDING_FUNDS;
    const header = genHeader(EventTypes.RequestApproved, EntityTypes.Request, requestId);
    const traderId = await redis.srandmember('pool:traderIds');

    await moveEntityStatus(requestId, 'request', fromStatus, RequestStatus.APPROVED);

    ;

    return {
        common: header,
        request_id: requestId,
        trader_id: traderId
    };
};

export const rejectRequest = async () => {
    const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`);
    if (!requestId) return null;

    const header = genHeader(EventTypes.RequestRejected, EntityTypes.Request, requestId);
    const traderId = await redis.srandmember('pool:traderIds');

    await moveEntityStatus(requestId, 'request', RequestStatus.PENDING_FUNDS, RequestStatus.REJECTED);

    return {
        common: header,
        request_id: requestId,
        trader_id: traderId,
        reason: Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    };
};

export const fulfillRequest = async () => {
    const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.APPROVED}`);
    if (!requestId) return null;

    const header = genHeader(EventTypes.RequestFulfilled, EntityTypes.Request, requestId);

    const [[, traderId], [, orderId]] = await redis
        .pipeline()
        .srandmember('pool:traderIds')
        .srandmember(`pool:orderIds:${OrderStatus.COMPLETED}`)
        .exec();

    await moveEntityStatus(requestId, 'request', RequestStatus.APPROVED, RequestStatus.FULFILLED);
    
    ;

    return {
        common: header,
        request_id: requestId,
        trader_id: traderId,
        order_id: orderId ?? ''
    };
};

export const expireRequest = async () => {
    const requestId = await redis.srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`);
    if (!requestId) return null;

    const header = genHeader(EventTypes.RequestExpired, EntityTypes.Request, requestId);

    await moveEntityStatus(requestId, 'request', RequestStatus.PENDING_FUNDS, RequestStatus.EXPIRED);
    
    ;

    return {
        common: header,
        request_id: requestId,
        due_date: faker.date.past().getTime()
    };
};

export const cancelRequest = async () => {
    const [[, createdId], [, pendingId], [, approvedId]] = await redis
        .pipeline()
        .srandmember(`pool:requestIds:${RequestStatus.CREATED}`)
        .srandmember(`pool:requestIds:${RequestStatus.PENDING_FUNDS}`)
        .srandmember(`pool:requestIds:${RequestStatus.APPROVED}`)
        .exec();

    const requestId = createdId || pendingId || approvedId;
    if (!requestId) return null;

    const fromStatus = createdId
        ? RequestStatus.CREATED
        : pendingId
            ? RequestStatus.PENDING_FUNDS
            : RequestStatus.APPROVED;

    const header = genHeader(EventTypes.RequestCancelled, EntityTypes.Request, requestId);
    const userId = await redis.srandmember('pool:userIds');

    await moveEntityStatus(requestId, 'request', fromStatus, RequestStatus.CANCELLED);
    
    ;

    return {
        common: header,
        request_id: requestId,
        user_id: userId,
        reason: Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    };
};