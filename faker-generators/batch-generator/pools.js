export const pools = {
    // ID registries
    userIds: [],
    traderIds: [],
    productIds: [],
    orderIds: [],

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