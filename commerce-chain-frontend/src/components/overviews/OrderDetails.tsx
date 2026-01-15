import { getFormattedDate, type OrderDetails, type ProductData, type ReceiptData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";

export default function OrderDetails({ entity: order, onEntityClick, onProductClick }: DetailsProps<OrderDetails>) {
    const getProductQuantity = (productId: string) => {
        return order.order.products.find(product => product["product-id"] === productId)?.quantity
    };

    const statusColour = order.order.status === "FULFILLED" ? "text-green-300" : "text-gray-300";

    return (
        <div className="space-y-4">
            <EntityDetailsDisplay
                title="Order Details"
                titleColor="text-indigo-400"
                labelColor="text-indigo-300"
                fields={[
                    { label: 'ID', value: order.order.id },
                    { label: 'Status', value: order.order.status, colour: statusColour },
                    {
                        label: 'Total cost',
                        value: order.order['total-cost'],
                        formatter: (val: number) => `$${val.toFixed(2)}`
                    },
                    {
                        label: 'Order placed',
                        value: order.order["created-date"],
                        formatter: (val: Date) => getFormattedDate(val)
                    },
                ]}
            />

            <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-y-2 border-indigo-400">
                <NestedEntityListSection
                    title="Products bought"
                    items={order.products || []}
                    colorScheme="indigo"
                    icon="package"
                    hasBorder={true}
                    borderPosition="right"
                    className="mt-4"
                    emptyMessage="No orders"
                    renderItem={(product: ProductData) => (
                        <ProductCard
                            product={product}
                            quantity={getProductQuantity(product.id)}
                            onClick={() => onProductClick?.(product)}
                            colorScheme="indigo"
                        />
                    )}
                />
                {/* Receipts Section */}
                <NestedEntityListSection
                    title="Receipts"
                    items={order.receipts || []}
                    colorScheme="indigo"
                    icon="receipt"
                    className="pt-2"
                    emptyMessage="No receipts"
                    renderItem={(receipt: ReceiptData) => (
                        <div
                            onClick={() => onEntityClick?.(receipt)}
                            className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-indigo-400 hover:shadow-lg hover:shadow-indigo-400/50 hover:bg-gray-600 cursor-pointer mt-4"
                        >
                            <div className="flex-1">
                                <h5 className="font-bold text-indigo-300">Seller id: {receipt["trader-id"]}</h5>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-indigo-300">Total cost: ${receipt["total-cost"]}</p>
                                <p className="text-xs text-gray-400">
                                    Order placed: {getFormattedDate(order.order["created-date"])}
                                </p>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
