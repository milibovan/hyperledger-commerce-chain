import { fakerSR_RS_latin as faker } from '@faker-js/faker';

export const genHeader = (event_type, entity_type) => {
    const event_id = faker.string.uuid();
    const entity_id = faker.string.uuid();
    const timestamp = Date.now();
    const correlation_id = faker.string.uuid();
    const causation_id = faker.string.uuid();

    const header = {
        event_id,
        event_type,
        entity_id,
        entity_type,
        timestamp,
        correlation_id,
        causation_id
    }

    return header;
}