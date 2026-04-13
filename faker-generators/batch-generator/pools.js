import Redis from 'ioredis';

export const pools = {
    // ID registries
    userIds: [],
    traderIds: [],
    productIds: [],

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

    await writeset('pool:userIds',    pools.userIds);
    await writeset('pool:traderIds',  pools.traderIds);
    await writeset('pool:productIds', pools.productIds);
    
    await redis.sadd('pool:orderIds:CREATED', ...createdOrderIds);
    await redis.sadd('pool:orderIds:APPROVED', ...approvedOrderIds);
    await redis.sadd('pool:orderIds:FULFILLED', ...fulfilledOrderIds);
    await redis.sadd('pool:orderIds:COMPLETED', ...completedOrderIds);
    await redis.sadd('pool:orderIds:CANCELLED', ...cancelledOrderIds);
    
    await redis.sadd('pool:receiptIds:CREATED', ...createdReceiptIds);
    await redis.sadd('pool:receiptIds:CANCELLED', ...cancelledReceiptIds);

    await redis.sadd('pool:requestIds:CREATED', ...createdRequestIds);
    await redis.sadd('pool:requestIds:PENDING_FUNDS', ...pendingRequestIds);
    await redis.sadd('pool:requestIds:APPROVED', ...approvedRequestIds);
    await redis.sadd('pool:requestIds:REJECTED', ...rejectedRequestIds);
    await redis.sadd('pool:requestIds:FULFILLED', ...fulfilledRequestIds);
    await redis.sadd('pool:requestIds:EXPIRED', ...expiredRequestIds);
    await redis.sadd('pool:requestIds:CANCELLED', ...cancelledRequestIds);

    console.log("✅ Pools written to Redis (db 1)");
    await redis.quit();
};