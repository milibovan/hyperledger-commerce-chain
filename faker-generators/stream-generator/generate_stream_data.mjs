import fs from "fs";
import avsc from "avsc";
import { parseSchema } from '../batch-generator/utils.js';
import { createUser, deleteUser } from './user_events.js';
import { redis } from "../batch-generator/pools.js";

const headerSchema = parseSchema("schema-header");
const userCreatedSchema   = parseSchema("user/user-created");
const userDeletedSchema   = parseSchema("user/user-deleted");

const registry = {};

avsc.Type.forSchema(headerSchema, { registry });
const UserCreatedEvent = avsc.Type.forSchema(userCreatedSchema, { registry });
const UserDeletedEvent = avsc.Type.forSchema(userDeletedSchema, { registry });

const userCreatedEvent = await createUser()
const userDeletedEvent = await deleteUser()
console.log(userCreatedEvent);
console.log(userDeletedEvent);

const buf = UserCreatedEvent.toBuffer(userCreatedEvent);
const bufDel = UserDeletedEvent.toBuffer(userDeletedEvent);
fs.writeFileSync("userCreatedEvent.avro", buf);
fs.writeFileSync("UserDeletedEvent.avro", bufDel);

const decoded = UserCreatedEvent.fromBuffer(buf);
const decodedDeleted = UserDeletedEvent.fromBuffer(bufDel);
console.log("Decoded:", decoded);
console.log("Decoded:", decodedDeleted);

await redis.quit()