import fs from "fs";
import { pools } from "./pools.js";

/**
 * Generic helper: reads a JSONL file line-by-line, passes each parsed object
 * through `transform`, and writes the results back to the same file.
 */
const rewriteJSONL = (filename, transform) =>
    new Promise((resolve) => {
        const records = [];
        const stream  = fs.createReadStream(filename, "utf8");
        let buffer = "";

        const processLine = (line) => {
            if (!line.trim()) return;
            records.push(transform(JSON.parse(line)));
        };

        stream.on("data", (chunk) => {
            buffer += chunk;
            const lines = buffer.split("\n");
            buffer = lines.pop(); // keep the incomplete trailing fragment
            lines.forEach(processLine);
        });

        stream.on("end", () => {
            processLine(buffer); // flush any remaining content
            const out = fs.createWriteStream(filename);
            records.forEach((r) => out.write(JSON.stringify(r) + "\n"));
            out.end(() => {
                console.log(`Updated ${filename} with relationships`);
                resolve();
            });
        });
    });

export const updateUsersWithRelationships = () => {
    console.log("Updating users with order and request IDs...");
    return rewriteJSONL("users.jsonl", (user) => ({
        ...user,
        "orders-ids":   pools.userOrders[user.id]   ?? [],
        "requests-ids": pools.userRequests[user.id]  ?? [],
    }));
};

export const updateTradersWithRelationships = () => {
    console.log("Updating traders with product, receipt, and request IDs...");
    return rewriteJSONL("traders.jsonl", (trader) => {
        const productMap = new Map();
        for (const p of pools.traderProducts[trader.id] ?? []) {
            if (productMap.has(p.product_id)) {
                productMap.get(p.product_id).quantity += p.quantity;
            } else {
                productMap.set(p.product_id, { ...p });
            }
        }
        return {
            ...trader,
            "products-available": Array.from(productMap.values()),
            "receipts-ids":       pools.traderReceipts[trader.id]  ?? [],
            "requests-ids":       pools.traderRequests[trader.id]  ?? [],
        };
    });
};

export const updateOrdersWithReceipts = () => {
    console.log("Updating orders with receipt IDs...");
    return rewriteJSONL("orders.jsonl", (order) => ({
        ...order,
        "receipts-ids": pools.orderReceipts[order.id] ?? [],
    }));
};