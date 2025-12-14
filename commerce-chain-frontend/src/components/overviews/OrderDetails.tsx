import { Package, Receipt } from "lucide-react";
import { getFormattedDate, type OrderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { orderFontSemibold, orderFontBold } from "../../utils/stylingUtils";
import ProductCard from "../reusables/ProductCard";

export default function OrderDetails({ entity: order, onEntityClick, onProductClick }: DetailsProps<OrderDetails>) {
    const getProductQuantity = (productId: string) => {
        return order.order.products.find(product => product["product-id"] === productId)?.quantity
    };

    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-indigo-400">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                    <span className={orderFontSemibold}>ID:</span> {order.order.id}
                </div>
                <div>
                    <span className={orderFontSemibold}>Total cost:</span> $
                    {order.order["total-cost"].toFixed(2)}
                </div>
                <div>
                    <span className={orderFontSemibold}>Order placed: </span>
                    {getFormattedDate(order.receipts[0].date)}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-y-2 border-indigo-400">
                <div className="mt-4 border-r-2 pr-4 border-indigo-400">
                    <h4 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
                        <Package size={20} />
                        Products bought ({order.products?.length || 0})
                    </h4>
                    {order.products?.length > 0 ? (
                        <div className="space-y-2">
                            {order.products.map((product) => (

                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    quantity={getProductQuantity(product.id)}
                                    onClick={() => onProductClick?.(product)}
                                    colorScheme="indigo"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-indigo-400">
                            No orders
                        </div>
                    )}

                </div>
                {/* Receipts Section */}
                <div className="pt-2">
                    <h4 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2 mt-2">
                        <Receipt size={20} />
                        Receipts ({order.receipts.length || 0})
                    </h4>
                    {order.receipts?.length > 0 ? (
                        <div className="space-y-2">
                            {order.receipts.map((receipt) => (
                                <div
                                    key={receipt.id}
                                    onClick={() => onEntityClick?.(receipt)}
                                    className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-indigo-400 hover:shadow-lg hover:shadow-indigo-400/50 hover:bg-gray-600"
                                >
                                    <div className="flex-1">
                                        <h5 className={orderFontBold}>Seller id: {receipt["trader-id"]}</h5>
                                    </div>
                                    <div className="text-right">
                                        <p className={orderFontBold}>Total cost: ${receipt["total-cost"]}</p>
                                        <p className="text-xs text-gray-400">
                                            Order placed:{" "}
                                            {getFormattedDate(receipt.date)}
                                        </p>
                                    </div>

                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-indigo-400">
                            No receipts
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
