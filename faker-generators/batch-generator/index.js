import { COUNTS, VERSATILE_USER_COUNT } from "./constants.js";
import { pools, writePoolsToRedis } from "./pools.js";
import { writeJSONL, initVersatileUsers } from "./utils.js";
import {
    genUser,
    genTrader,
    genProduct,
    genOrder,
    genReceipt,
    genRequest,
    initVersatileUsersArray
} from "./generators.js";
import {
    updateUsersWithRelationships,
    updateTradersWithRelationships,
    updateOrdersWithReceipts,
} from "./updaters.js";

const runAll = async () => {
    console.log("Starting generation...");

    await writeJSONL("airflow/files/users.jsonl",          COUNTS.users,     genUser);
    await writeJSONL("airflow/files/traders.jsonl",        COUNTS.traders,   genTrader);
    await writeJSONL("airflow/files/products.jsonl",       COUNTS.products,  genProduct);
    await writeJSONL("airflow/files/orders.jsonl",         COUNTS.orders,    genOrder);
    await writeJSONL("airflow/files/order_requests.jsonl", COUNTS.requests,  genRequest);

    initVersatileUsers();
    initVersatileUsersArray();

    await writeJSONL("airflow/files/receipts.jsonl", COUNTS.receipts, genReceipt);

    const coverage        = Object.values(pools.versatileUserCoverage);
    const fullyVersatile  = coverage.filter((s) => s.size >= 3).length;
    console.log(
        `Versatile users with >= 3 trader types covered: ${fullyVersatile} / ${VERSATILE_USER_COUNT}`
    );

    await updateUsersWithRelationships();
    await updateTradersWithRelationships();
    await updateOrdersWithReceipts();

    await writePoolsToRedis();

    console.log("✅ All data generated successfully with relationships!");
};

runAll();