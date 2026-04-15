import Redis from 'ioredis';
import 'dotenv/config';

export const pools = {
    // ID registries
    userIds: [],
    traderIds: [],
    productIds: [],

    deletedUserIds: [],
    deletedTraderIds: [],
    deletedProductIds: [],

    createdOrderIds: [],
    approvedOrderIds: [],
    fulfilledOrderIds: [],
    completedOrderIds: [],
    cancelledOrderIds: [],

    createdReceiptIds: [],
    cancelledReceiptIds: [],

    createdRequestIds: [],
    pendingRequestIds: [],
    approvedRequestIds: [],
    rejectedRequestIds: [],
    fulfilledRequestIds: [],
    expiredRequestIds: [],
    cancelledRequestIds: [],

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

export const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: 1,
    password: process.env.REDIS_PASSWORD
});

export const writePoolsToRedis = async () => {

    console.log("Writing pools to Redis...");

    const CHUNK = 5000;

    const writeset = async (key, ids) => {
        await redis.del(key);
        for (let i = 0; i < ids.length; i += CHUNK) {
            await redis.sadd(key, ...ids.slice(i, i + CHUNK));
        }
        console.log(`  wrote ${ids.length} ids to ${key}`);
    };

    await writeset('pool:userIds', pools.userIds);
    await writeset('pool:userIds:DELETED', pools.deletedUserIds);
    await writeset('pool:traderIds', pools.traderIds);
    await writeset('pool:traderIds:DELETED', pools.deletedTraderIds);
    await writeset('pool:productIds', pools.productIds);
    await writeset('pool:productIds:DELETED', pools.deletedProductIds);

    await writeset('pool:orderIds:CREATED', pools.createdOrderIds);
    await writeset('pool:orderIds:APPROVED', pools.approvedOrderIds);
    await writeset('pool:orderIds:FULFILLED', pools.fulfilledOrderIds);
    await writeset('pool:orderIds:COMPLETED', pools.completedOrderIds);
    await writeset('pool:orderIds:CANCELLED', pools.cancelledOrderIds);

    await writeset('pool:receiptIds:CREATED', pools.createdReceiptIds);
    await writeset('pool:receiptIds:CANCELLED', pools.cancelledReceiptIds);

    await writeset('pool:requestIds:CREATED', pools.createdRequestIds);
    await writeset('pool:requestIds:PENDING_FUNDS', pools.pendingRequestIds);
    await writeset('pool:requestIds:APPROVED', pools.approvedRequestIds);
    await writeset('pool:requestIds:REJECTED', pools.rejectedRequestIds);
    await writeset('pool:requestIds:FULFILLED', pools.fulfilledRequestIds);
    await writeset('pool:requestIds:EXPIRED', pools.expiredRequestIds);
    await writeset('pool:requestIds:CANCELLED', pools.cancelledRequestIds);

    console.log("✅ Pools written to Redis (db 1)");

    await redis.quit();
};