import fs from "fs";
import avsc from "avsc";
import { parseSchema, handleEvent, seedFraudUser } from '../batch-generator/utils.js';
import { redis } from "../batch-generator/pools.js";
import { randomEntityAction, EVENT_GENERATORS } from '../batch-generator/constants.js';

async function main() {
    const mode = process.env.MODE;

    if (mode === 'fraud') {
        await seedFraudUser();
        await redis.quit();
        return;
    }

    const { entity, action, orchestrated } = randomEntityAction();
    await handleEvent(entity, action, orchestrated);
    await redis.quit();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

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