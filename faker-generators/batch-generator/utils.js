import fs from "fs";
import { fakerSR_RS_latin as faker } from "@faker-js/faker";
import { VERSATILE_USER_COUNT } from "./constants.js";
import { pools } from "./pools.js";

/**
 * Streams `count` records produced by `generator` to a JSONL file.
 */
export const writeJSONL = (filename, count, generator) =>
    new Promise((resolve) => {
        const stream = fs.createWriteStream(filename);
        for (let i = 0; i < count; i++) {
            stream.write(JSON.stringify(generator()) + "\n");
        }
        stream.end(() => {
            console.log(`Created ${filename} (${count} records)`);
            resolve();
        });
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
    return JSON.parse(fs.readFileSync(`../../schemas/streams-schemas/${schema_name}.avsc`, "utf8"));
}