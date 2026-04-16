import fs from "fs";
import avsc from "avsc";
import { parseSchema } from '../batch-generator/utils.js';
import { redis } from "../batch-generator/pools.js";
import { randomEntityAction, EVENT_GENERATORS } from '../batch-generator/constants.js';

const headerSchema = parseSchema("schema-header");

const { entity, action } = randomEntityAction();
console.log(`Generating event: ${entity}-${action}`);

const schemaPath = `${entity}/${entity}-${action}`;
const schema = parseSchema(schemaPath);

const registry = {};
avsc.Type.forSchema(headerSchema, { registry });
const EventType = avsc.Type.forSchema(schema, { registry });

const generator = EVENT_GENERATORS[entity]?.[action];
if (!generator) throw new Error(`No generator for ${entity}-${action}`);

const event = await generator();
console.log("Event:", event);

const buf = EventType.toBuffer(event);
fs.writeFileSync(`${entity}-${action}.avro`, buf);

const decoded = EventType.fromBuffer(buf);
console.log("Decoded:", decoded);

await redis.quit();

// ! FOR TESTING ALL EVENTS
// for (const { entity, action } of getAllEvents()) {
//     console.log(`Generating event: ${entity}-${action}`);

//     const schemaPath = `${entity}/${entity}-${action}`;
//     const schema = parseSchema(schemaPath);

//     const registry = {};
//     avsc.Type.forSchema(headerSchema, { registry });
//     const EventType = avsc.Type.forSchema(schema, { registry });

//     const generator = EVENT_GENERATORS[entity]?.[action];
//     if (!generator) throw new Error(`No generator for ${entity}-${action}`);

//     const event = await generator();
//     console.log("Event:", event);

//     const buf = EventType.toBuffer(event);
//     fs.writeFileSync(`${entity}-${action}.avro`, buf);

//     const decoded = EventType.fromBuffer(buf);
//     console.log("Decoded:", decoded);
// }