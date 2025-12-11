import type { OrderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { userFontBold, userFontSemibold } from "../../utils/stylingUtils";

export default function OrderDetails({ entity: order }: DetailsProps<OrderDetails>) {
    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-indigo-400">User Details</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                    <span className={userFontSemibold}>ID:</span> {order.order.id}
                </div>
                <div>
                    <span className={userFontSemibold}>Balance:</span> $
                    {order.order["total-cost"].toFixed(2)}
                </div>
                <div>
                    <span className={userFontSemibold}>Order placed:</span>
                    {new Date(order.receipts[0].date).toLocaleDateString()}
                </div>
            </div>
            <div className="pt-4 border-t-2 border-indigo-400">
                <h4 className="text-xl font-bold text-indigo-300 mb-2">
                    Orders ({order.products?.length || 0})
                </h4>
                {order.products?.length > 0 ? (
                    <div className="space-y-2">
                        {order.products.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-indigo-400 hover:shadow-lg hover:shadow-indigo-400/50 hover:bg-gray-600"
                            >
                                <div className="flex-1">
                                    <h5 className={userFontBold}>Products bought: {order.products.length}</h5>
                                </div>
                                {/* TODO Implement ProductCard */}
                                {/* <ProductCard
                                    key={product.id}
                                    product={product}
                                    quantity={getProductQuantity(product.id)}
                                    onClick={() => onProductClick?.(product)}
                                    colorScheme="pink"
                                /> */}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-indigo-400">
                        No orders
                    </div>
                )}
            </div>
        </div>
    );
}
