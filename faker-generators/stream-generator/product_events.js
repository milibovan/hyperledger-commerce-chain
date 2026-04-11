import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { EntityTypes, EventTypes, TRADER_TYPES, PRODUCT_CATEGORIES } from '../batch-generator/constants';
import { genHeader } from './event_header_generator';
import { redis } from '../batch-generator/pools';

export const createProduct = () => {
    const header = genHeader(EventTypes.ProductCreated, EntityTypes.Product)
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);
    
    const productName = `${category.name} ${faker.commerce.productAdjective()}`;

    redis.sadd("pool:productIds", header.event_id)    

    const productCreatedEvent = {
        "common": header,
        "name": productName,
        "price": parseFloat(faker.number.float({ 
            min: category.priceRange[0], 
            max: category.priceRange[1],
            fractionDigits: 2 
        })),
        "quantity": faker.number.int({ min: 50, max: 1000 }),
        "trader-type": traderType,
        "expiry_date": faker.date.soon().getTime()
    }
    
    return productCreatedEvent
};

export const deleteProduct = () => {
    const header = genHeader(EventTypes.ProductDeleted, EntityTypes.Product)

    const productDeletedEvent = {
        "common": header,
    }

    // pools.userIds.push(id);
    // pools.userOrders[id] = [];
    // pools.userRequests[id] = [];
    
    return productDeletedEvent
};