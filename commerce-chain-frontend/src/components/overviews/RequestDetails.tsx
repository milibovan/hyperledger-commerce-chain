import { getFormattedDate, type RequestDetails, type ProductData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";

export default function RequestDetails({ entity: request, onProductClick }: DetailsProps<RequestDetails>) {
    const getProductQuantity = (productId: string) => {
        return request.request.products.find(product => product["product-id"] === productId)?.quantity
    };

    const statusColour = request.request.status === "CREATED" ? "text-green-300" : "text-gray-300";

    return (
        <div className="space-y-4">
            <EntityDetailsDisplay
                title="Request Details"
                titleColor="text-amber-400"
                labelColor="text-amber-300"
                fields={[
                    { label: 'ID', value: request.request.id },
                    { label: 'Status', value: request.request.status, colour: statusColour },
                    {
                        label: 'Total cost',
                        value: request.request['total-cost'],
                        formatter: (val: number) => `$${val.toFixed(2)}`
                    },
                    {
                        label: 'Request placed',
                        value: request.request["created-date"],
                        formatter: (val: Date) => getFormattedDate(val)
                    },
                ]}
            />

            <div className="grid grid-cols-1 gap-4 text-gray-300 pb-4 border-y-2 border-amber-400">
                <NestedEntityListSection
                    title="Products bought"
                    items={request.products || []}
                    colorScheme="amber"
                    icon="package"
                    className="mt-4"
                    emptyMessage="No orders"
                    renderItem={(product: ProductData) => (
                        <ProductCard
                            product={product}
                            quantity={getProductQuantity(product.id)}
                            onClick={() => onProductClick?.(product)}
                            colorScheme="amber"
                        />
                    )}
                />
            </div>
        </div>
    );
}
