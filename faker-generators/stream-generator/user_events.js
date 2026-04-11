import { fakerSR_RS_latin as faker } from '@faker-js/faker';
import { genHeader } from './event_header_generator';
import { EntityTypes, EventTypes} from '../batch-generator/constants';
import { redis } from '../batch-generator/pools';


export const createUser = () => {
    const header = genHeader(EventTypes.UserCreated, EntityTypes.User)

    redis.sadd('pool:userIds', header.entity_id);
    
    const userCreatedEvent = {
        "common": header,
        "name": faker.person.firstName(),
        "surname": faker.person.lastName(),
        "email": faker.internet.email(),
        "balance": parseFloat(faker.finance.amount({ min: 500, max: 50000, dec: 2 })),
    }
    
    return userCreatedEvent
};

export const deleteUser = () => {
    const header = genHeader(EventTypes.UserDeleted, EntityTypes.User)

    const userDeletedEvent = {
        "common": header,
        "reason": Math.random() >= 0.5 ? faker.lorem.lines({ min: 1, max: 3 }) : ''
    }
    
    return userDeletedEvent
};