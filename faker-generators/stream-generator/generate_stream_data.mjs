import fs from "fs";
import avsc from "avsc";
import { parseSchema } from '../batch-generator/utils.js';
import { redis } from "../batch-generator/pools.js";
import { randomEntityAction, EVENT_GENERATORS } from '../batch-generator/constants.js';

function emitEvent(event, entity, action) {
    const headerSchema = parseSchema("schema-header");
    const schema = parseSchema(`${entity}/${entity}-${action}`);

    const registry = {};
    avsc.Type.forSchema(headerSchema, { registry });
    const EventType = avsc.Type.forSchema(schema, { registry });

    const buf = EventType.toBuffer(event);
    process.stdout.write(JSON.stringify({
        headerSchema: JSON.stringify(headerSchema),
        schema: JSON.stringify(schema),
        data: buf.toString("base64"),
        key: event.common.entity_id
    }) + "\n");
}

async function main() {
    const { entity, action, orchestrated } = randomEntityAction();

    if (orchestrated && entity === 'order' && (action === 'fulfilled' || action === 'completed')) {
        const fulfilledOrder = await EVENT_GENERATORS.order.fulfilled();
        if (!fulfilledOrder) { await redis.quit(); return; }
        emitEvent(fulfilledOrder, 'order', 'fulfilled');

        const orderId = fulfilledOrder.common.entity_id;
        const receiptIds = await redis.smembers(`pool:orderReceiptIds:${orderId}`);
        for (const receiptId of receiptIds) {
            const receipt = await createReceipt(receiptId);
            emitEvent(receipt, 'receipt', 'created');
        }

        const completedOrder = await completeOrder();
        if (!completedOrder) { await redis.quit(); return; }
        emitEvent(completedOrder, 'order', 'completed');
    } else {
        const schemaPath = `${entity}/${entity}-${action}`;
        const schema = parseSchema(schemaPath);
        const headerSchema = parseSchema("schema-header");

        const registry = {};
        avsc.Type.forSchema(headerSchema, { registry });
        const EventType = avsc.Type.forSchema(schema, { registry });

        const generator = EVENT_GENERATORS[entity]?.[action];
        if (!generator) throw new Error(`No generator for ${entity}-${action}`);

        const event = await generator();
        const buf = EventType.toBuffer(event);
        process.stdout.write(JSON.stringify({
            headerSchema: JSON.stringify(headerSchema),
            schema: JSON.stringify(schema),
            data: buf.toString("base64"),
            key: event.common.entity_id
        }) + "\n");
    }

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