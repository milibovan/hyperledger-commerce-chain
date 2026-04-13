import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator';
import { EntityTypes, EventTypes, ReceiptStatus } from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';
import { numProducts } from '../batch-generator/constants';
import { moveEntityStatus } from '../batch-generator/utils';

export const createReceipt = async () => {
    const header = genHeader(EventTypes.ReceiptCreated, EntityTypes.Receipt)

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

    redis.sadd(`pool:receiptIds:${ReceiptStatus.CREATED}`, header.entity_id)

    const receiptCreatedEvent = {
        "common": header,
        "user_id": userId,
        "trader_id": traderId,
        "products": products,
        "total_cost": total_cost,
        "due_date": faker.date.soon().getTime()
    }

    return receiptCreatedEvent
};

export const cancelReceipt = async () => {
    const receiptId = await redis.srandmember(`pool:receiptIds:${ReceiptStatus.CREATED}`);

    const header = genHeader(EventTypes.ReceiptCancelled, EntityTypes.Receipt, receiptId)

    await moveEntityStatus(receiptId, EntityTypes.Receipt.toLowerCase(), ReceiptStatus.CREATED, ReceiptStatus.CANCELLED)

    const receiptCancelledEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }

    return receiptCancelledEvent
};