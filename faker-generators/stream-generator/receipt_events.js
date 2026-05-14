import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event_header_generator.js';
import { EntityTypes, EventTypes, ReceiptStatus, quantity } from '../batch-generator/constants.js';
import { redis } from '../batch-generator/pools.js';
import { numProducts } from '../batch-generator/constants.js';
import { moveEntityStatus } from '../batch-generator/utils.js';

export const createReceipt = async (receiptId = null) => {
    const header = genHeader(EventTypes.ReceiptCreated, EntityTypes.Receipt, receiptId ?? undefined);

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

    if (!receiptId) {
        await redis.sadd(`pool:receiptIds:${ReceiptStatus.CREATED}`, header.entity_id);
    }

    return {
        common: header,
        user_id: userId,
        trader_id: traderId,
        products,
        total_cost,
        due_date: faker.date.soon().getTime()
    };
};

export const cancelReceipt = async () => {
    const receiptId = await redis.srandmember(`pool:receiptIds:${ReceiptStatus.CREATED}`);

    const header = genHeader(EventTypes.ReceiptCancelled, EntityTypes.Receipt, receiptId)

    await moveEntityStatus(receiptId, EntityTypes.Receipt.toLowerCase(), ReceiptStatus.CREATED, ReceiptStatus.CANCELLED)
    
    ;

    const receiptCancelledEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }

    return receiptCancelledEvent
};