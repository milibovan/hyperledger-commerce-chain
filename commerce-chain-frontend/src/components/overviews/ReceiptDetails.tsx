import { getFormattedDate, type ProductData, type ReceiptDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import LoadingSkeleton from "../reusables/LoadingSkeleton";
import InfoSection from "../reusables/InfoSection";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";

export default function ReceiptDetails({
    entity: receipt,
    productsLoading,
    onProductClick,
    onEntityClick
}: DetailsProps<ReceiptDetails>) {
    const getProductQuantity = (productId: string) => {
        return receipt.receipt.products.find(
            (productItem) => productItem["product-id"] === productId
        )?.quantity;
    };

    const statusColour = receipt.receipt.status === "COMPLETED" ? "text-green-300" : "text-gray-300";

    return (
        <div className="space-y-6">
            <EntityDetailsDisplay
                title="Receipt Details"
                titleColor="text-green-400"
                labelColor="text-green-300"
                columns={1}
                fields={[
                    { label: 'ID', value: receipt.receipt.id },
                    {
                        label: 'Date created',
                        value: receipt.receipt.date,
                        formatter: (val) => getFormattedDate(val)
                    },
                    {
                        label: 'Total cost',
                        value: receipt.receipt['total-cost'],
                        formatter: (val) => `$${val}`
                    },
                    { label: 'Status', value: receipt.receipt.status, colour: statusColour },
                ]}
            />
            <div className={`grid grid-cols-2 gap-4 text-gray-300 py-4`}>
                {/* User Info Section */}
                <InfoSection
                    title="User Info"
                    id={receipt.user.id}
                    entity={receipt.user}
                    label="User"
                    value={`${receipt.user.name} ${receipt.user.surname}`}
                    onEntityClick={onEntityClick!}
                />

                {/* Trader Info Section */}
                <InfoSection
                    title="Trader Info"
                    id={receipt.trader.id}
                    entity={receipt.trader}
                    label="Trader"
                    value={receipt.trader.name}
                    onEntityClick={onEntityClick!}
                />
            </div>


            {/* Products Section */}
            <NestedEntityListSection
                title="Products"
                items={receipt.products || []}
                colorScheme="green"
                icon="package"
                isLoading={productsLoading}
                loadingComponent={<LoadingSkeleton />}
                emptyMessage="No products available"
                renderItem={(product: ProductData) => (
                    <ProductCard
                        product={product}
                        quantity={getProductQuantity(product.id)}
                        onClick={() => onProductClick?.(product)}
                        colorScheme="green"
                    />
                )}
            />
        </div>
    );
}