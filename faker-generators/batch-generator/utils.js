import fs from "fs";
import { fakerSR_RS_latin as faker } from "@faker-js/faker";
import { VERSATILE_USER_COUNT, VALID_TRANSITIONS, EVENT_GENERATORS } from "./constants.js";
import { pools, redis } from "./pools.js";

/**
 * Streams `count` records produced by `generator` to a JSONL file.
 */
export const writeJSONL = (filename, count, generator) =>
    new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filename);
        const start = performance.now();
        let drainCount = 0;

        const writeNext = (i) => {
            if (i >= count) {
                const elapsed = ((performance.now() - start) / 1000).toFixed(2);
                stream.end(() => {
                    console.log(`✅ ${filename} done — ${count} records in ${elapsed}s (drains: ${drainCount})`);
                    resolve();
                });
                return;
            }

            // Log progress every 500 records
            if (i % 1000 === 0) {
                const elapsed = ((performance.now() - start) / 1000).toFixed(2);
                console.log(`  [${filename}] ${i}/${count} — ${elapsed}s elapsed`);
            }

            const ok = stream.write(JSON.stringify(generator()) + "\n");

            if (!ok) {
                drainCount++;
                console.log(`  [${filename}] ⏸ backpressure at record ${i} (drain #${drainCount})`);
                stream.once('drain', () => setImmediate(() => writeNext(i + 1)));
            } else {
                setImmediate(() => writeNext(i + 1));
            }
        };

        stream.on('error', reject);
        writeNext(0);
    });

/**
 * Designates a random subset of users as "versatile buyers" who will be
 * steered toward covering >= 3 distinct trader types in receipt generation.
 */
export const initVersatileUsers = () => {
    pools.versatileUserIds = new Set(
        faker.helpers.arrayElements(pools.userIds, VERSATILE_USER_COUNT)
    );
    console.log(`Designated ${VERSATILE_USER_COUNT} versatile buyers.`);
};

export const parseSchema = (schema_name) => {
    const base = process.env.SCHEMAS_PATH || "../../../schemas/streams-schemas";
    return JSON.parse(fs.readFileSync(`${base}/${schema_name}.avsc`, "utf8"));
}

export const moveEntityStatus = async (id, entity, fromStatus, toStatus) => {
    const entityTransitions = VALID_TRANSITIONS[entity];

    if (!entityTransitions) {
        throw new Error(`Invalid entity type: ${entity}. Must be one of: ${Object.keys(VALID_TRANSITIONS).join(', ')}`);
    }

    const allowedTransitions = entityTransitions[fromStatus];

    if (!allowedTransitions) {
        throw new Error(`Invalid fromStatus "${fromStatus}" for entity "${entity}". Must be one of: ${Object.keys(entityTransitions).join(', ')}`);
    }

    if (!allowedTransitions.includes(toStatus)) {
        throw new Error(`Invalid transition for "${entity}": ${fromStatus} → ${toStatus}. Allowed: ${allowedTransitions.join(', ') || 'none (terminal status)'}`);
    }

    await redis
        .pipeline()
        .srem(`pool:${entity}Ids:${fromStatus}`, id)
        .sadd(`pool:${entity}Ids:${toStatus}`, id)
        .exec();
};

export const addEntityPerStatus = async (id, entity, status) => {
    await redis
        .pipeline()
        .sadd(`pool:${entity}Ids:${status}`, id)
        .exec();
};

export async function seedFraudUser() {
    const user = await EVENT_GENERATORS.user.created();
    const fraudUserId = user.common.entity_id;
    await redis.set('fraud:target_user_id', fraudUserId);
    emitEvent(user, 'user', 'created');

    for (let i = 0; i < 5; i++) {
        const order = await EVENT_GENERATORS.order.created({ user_id: fraudUserId });
        if (order) emitEvent(order, 'order', 'created');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    let cancelled = 0;
    for (let i = 0; i < 5; i++) {
        const order = await EVENT_GENERATORS.order.cancelled({ user_id: fraudUserId });
        if (!order) {
            console.warn(`cancelOrder returned null on iteration ${i}`);
            continue;
        }
        emitEvent(order, 'order', 'cancelled');
        cancelled++;
    }

    console.error(`Fraud seed complete: user=${fraudUserId}, cancelled=${cancelled}`);

    await redis.del('fraud:target_user_id');
}

export async function handleEvent(entity, action, orchestrated = false) {
    if (orchestrated && entity === 'order' && (action === 'fulfilled' || action === 'completed')) {
        const fulfilledOrder = await EVENT_GENERATORS.order.fulfilled();
        if (!fulfilledOrder) return;
        emitEvent(fulfilledOrder, 'order', 'fulfilled');

        const orderId = fulfilledOrder.common.entity_id;
        const receiptIds = await redis.smembers(`pool:orderReceiptIds:${orderId}`);
        for (const receiptId of receiptIds) {
            const receipt = await createReceipt(receiptId);
            emitEvent(receipt, 'receipt', 'created');
        }

        const completedOrder = await completeOrder();
        if (!completedOrder) return;
        emitEvent(completedOrder, 'order', 'completed');
    } else {
        const generator = EVENT_GENERATORS[entity]?.[action];
        if (!generator) throw new Error(`No generator for ${entity}-${action}`);
        const event = await generator();
        if (event) emitEvent(event, entity, action);
    }
}

export function emitEvent(event, entity, action) {
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