import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator';
import { EntityTypes, EventTypes } from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';

export const createReceipt = () => {
    const header = genHeader(EventTypes.ReceiptCreated, EntityTypes.Receipt)

    redis.sadd("pool:receiptIds", header.event_id)

    const receiptCreatedEvent = {
        "common": header,
        }
    
    return receiptCreatedEvent
};

export const cancelReceipt = () => {
    const header = genHeader(EventTypes.ReceiptCancelled, EntityTypes.Receipt)

    const receiptCancelledEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return receiptCancelledEvent
};