import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator.js';
import { EntityTypes, EventTypes, TRADER_TYPES } from '../batch-generator/constants.js';
import { redis } from '../batch-generator/pools.js';


export const createTrader = async () => {
    const header = genHeader(EventTypes.TraderCreated, EntityTypes.Trader)
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);

    await redis.sadd("pool:traderIds", header.event_id);

    const traderCreatedEvent = {
        "common": header,
        "name": faker.person.firstName(),
        "email": faker.internet.email(),
        "trader-type": traderType,
        "balance": parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),
        "vat": "VAT-" + faker.string.alphanumeric(8).toUpperCase(),
    }

    ;

    return traderCreatedEvent
};

export const deleteTrader = async () => {
    const traderId = await redis.srandmember('pool:traderIds');

    const header = genHeader(EventTypes.TraderDeleted, EntityTypes.Trader, traderId)

    const traderDeletedEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }

    return traderDeletedEvent
};