import Redis from 'ioredis';

export const pools = {
    // ID registries
    userIds: [],
    traderIds: [],
    productIds: [],
    orderIds: [],
    receiptIds: [],
    requestIds: [],

    // Product lookup by trader type
    productsByTrader: {},

    // Relationship tracking (populated during generation, used by updaters)
    userOrders: {},
    userRequests: {},
    traderReceipts: {},
    traderRequests: {},
    traderProducts: {},
    orderReceipts: {},
    orderUsers: {},
    orderDates: {},

    // Trader type maps
    traderTypeMap: {},    // traderId  -> traderType
    tradersByType: {},    // traderType -> [traderIds]

    // Versatile buyer tracking
    versatileUserIds: null,          // Set of userIds designated as versatile buyers
    versatileUserCoverage: {},       // userId -> Set of trader types already covered
};

export const writePoolsToRedis = async () => {
    const redis = new Redis({ 
        host: process.env.REDIS_HOST || 'localhost', 
        port: parseInt(process.env.REDIS_PORT || '6379'),
        db: 1,
        password: process.env.REDIS_PASSWORD
    });
    console.log("Writing pools to Redis...");

    const CHUNK = 5000;

    const writeset = async (key, ids) => {
        await redis.del(key);
        for (let i = 0; i < ids.length; i += CHUNK) {
            await redis.sadd(key, ...ids.slice(i, i + CHUNK));
        }
        console.log(`  wrote ${ids.length} ids to ${key}`);
    };

    await writeset('pool:userIds',    pools.userIds);
    await writeset('pool:traderIds',  pools.traderIds);
    await writeset('pool:orderIds',   pools.orderIds);
    await writeset('pool:productIds', pools.productIds);
    await writeset('pool:receiptIds', pools.receiptIds);
    await writeset('pool:requestIds', pools.requestIds);

    console.log("✅ Pools written to Redis (db 1)");
    await redis.quit();
};