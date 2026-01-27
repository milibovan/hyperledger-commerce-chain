import { fakerSR_RS_latin as faker } from '@faker-js/faker';

// Generate a random name and address
const firstName = faker.person.firstName();
const lastName = faker.person.lastName();
const fullName = faker.person.fullName({ firstName, lastName });
const email = faker.internet.email({ firstName, lastName });
const streetAddress = faker.location.streetAddress();
const city = faker.location.city();
const zipCode = faker.location.zipCode();
const uuid = faker.string.uuid();


console.log(`User ID: ${uuid}`);
console.log(`Employee: ${fullName}`);
console.log(`Email: ${email}`);
console.log(`Address: ${streetAddress}, ${city}, ${zipCode}`);
