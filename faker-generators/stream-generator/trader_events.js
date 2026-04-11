import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event-header-generator';
import { EntityTypes, EventTypes, TRADER_TYPES } from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';


export const createTrader = () => {
    const header = genHeader(EventTypes.TraderCreated, EntityTypes.Trader)
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);

    redis.sadd("pool:traderIds", header.event_id);

    const traderCreatedEvent = {
        "common": header,
        "name": faker.person.firstName(),
        "email": faker.internet.email(),
        "trader-type": traderType,
        "balance": parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),
        "vat": "VAT-" + faker.string.alphanumeric(8).toUpperCase(), 
    }
    
    return traderCreatedEvent
};

export const deleteTrader = () => {
    const header = genHeader(EventTypes.TraderDeleted, EntityTypes.Trader)

    const traderDeletedEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return traderDeletedEvent
};