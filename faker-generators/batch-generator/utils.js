import fs from "fs";
import { fakerSR_RS_latin as faker } from "@faker-js/faker";
import { VERSATILE_USER_COUNT } from "./constants.js";
import { pools, redis } from "./pools.js";

/**
 * Streams `count` records produced by `generator` to a JSONL file.
 */
export const writeJSONL = (filename, count, generator) =>
    new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filename);

        const writeNext = async (i) => {
            if (i >= count) {
                stream.end(() => {
                    console.log(`Created ${filename} (${count} records)`);
                    resolve();
                });
                return;
            }

            try {
                const record = await generator();
                const ok = stream.write(JSON.stringify(record) + "\n");

                if (!ok) {
                    stream.once('drain', () => writeNext(i + 1));
                } else if (i % 1000 === 0) {
                    setImmediate(() => writeNext(i + 1));
                } else {
                    writeNext(i + 1);
                }
            } catch (err) {
                reject(err);
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
    return JSON.parse(fs.readFileSync(`../../../schemas/streams-schemas/${schema_name}.avsc`, "utf8"));
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