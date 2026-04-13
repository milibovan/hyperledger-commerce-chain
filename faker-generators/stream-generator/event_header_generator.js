import { fakerSR_RS_latin as faker } from '@faker-js/faker';

export const genHeader = (event_type, entity_type, entity_id) => {
    return {
        event_id: faker.string.uuid(),
        event_type,
        entity_type,
        entity_id: entity_id ?? faker.string.uuid(),
        timestamp: Date.now(),
        correlation_id: faker.string.uuid(),
        causation_id: faker.string.uuid()
    };
}