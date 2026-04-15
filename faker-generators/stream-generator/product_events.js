import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { EntityTypes, EventTypes, TRADER_TYPES, PRODUCT_CATEGORIES, quantity } from '../batch-generator/constants.js';
import { genHeader } from './event_header_generator.js';
import { redis } from '../batch-generator/pools.js';

export const createProduct = async () => {
    const header = genHeader(EventTypes.ProductCreated, EntityTypes.Product)
    const traderType = faker.helpers.arrayElement(TRADER_TYPES);
    const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES[traderType]);

    const productName = `${category.name} ${faker.commerce.productAdjective()}`;

    await redis.sadd("pool:productIds", header.entity_id)

    const productCreatedEvent = {
        "common": header,
        "name": productName,
        "price": parseFloat(faker.number.float({
            min: category.priceRange[0],
            max: category.priceRange[1],
            fractionDigits: 2
        })),
        "quantity": quantity,
        trader_type: traderType,
        "expiry_date": faker.date.soon().getTime()
    };

    return productCreatedEvent
};

export const deleteProduct = async () => {
    const productId = await redis.srandmember('pool:productIds');

    if (!productId) throw new Error('No active products available to delete');

    const header = genHeader(EventTypes.ProductDeleted, EntityTypes.Product, productId)

    await redis.multi()
        .srem('pool:productIds', productId)
        .sadd('pool:productIds:DELETED', productId)
        .exec();

    const productDeletedEvent = {
        "common": header,
    };

    return productDeletedEvent
};