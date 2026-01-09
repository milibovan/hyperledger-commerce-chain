import { Plus } from "lucide-react";
import { getFormattedDate, type ProductData, type RequestDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import ProductCard from "../reusables/ProductCard";

export default function UpdateRequest({ entity: request, onProductClick }: DetailsProps<RequestDetails>) {
    const getProductQuantity = (productId: string) => {
        return request.request.products.find(product => product["product-id"] === productId)?.quantity
    };

    // const statusColour = request.request.status === "CREATED" ? "text-green-300" : "text-gray-300";

    return (
        <>
            <EntityDetailsDisplay
                title="Request Details"
                titleColor="text-amber-400"
                labelColor="text-amber-300"
                borderColor="border-amber-400"
                fields={[
                    { label: 'ID', value: request.request.id },
                    {
                        label: 'Request value',
                        value: request.request["total-cost"],
                        formatter: (val) => `$${val.toFixed(2)}`
                    },
                    { label: 'Created Date', value: request.request["created-date"], formatter: (val) => getFormattedDate(val) },
                    { label: 'Due Date', value: request.request["due-date"], formatter: (val) => getFormattedDate(val) },
                ]}
            />
            <div className="mt-4">

                <EntityDetailsDisplay
                    title="User Details"
                    titleColor="text-amber-400"
                    labelColor="text-amber-300"
                    hasBorder={true}
                    borderColor="border-amber-400"
                    fields={[
                        { label: 'ID', value: request.user.id },
                        { label: 'Email', value: request.user.email },
                        {
                            label: 'Name',
                            value: `${request.user.name} ${request.user.surname}`
                        },
                        {
                            label: 'Balance',
                            value: request.user.balance,
                            formatter: (val) => `$${val.toFixed(2)}`
                        },
                        {
                            label: 'Orders placed',
                            value: request.user["orders-ids"].length
                        },
                        {
                            label: 'Requests placed',
                            value: request.user["requests-ids"].length
                        }
                    ]}
                />
            </div >
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
            <div className="mt-5 flex justify-end">
                <button
                    className={`flex items-center bg-green-600 hover:bg-green-500 border-green-400 gap-2 px-6 py-3 text-white font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg`}
                >
                    <Plus size={20} />
                    Assign
                </button>
            </div>
        </>
    )
}