import { Package } from "lucide-react";
import { getFormattedDate, type ReceiptDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import LoadingSkeleton from "../reusables/LoadingSkeleton";
import InfoSection from "../reusables/InfoSection";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";

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
                        // TODO Solve error
                        value: receipt.receipt.date,
                        formatter: (val) => getFormattedDate(val)
                    },
                    {
                        label: 'Total cost',
                        value: receipt.receipt['total-cost'],
                        formatter: (val) => `$${val}`
                    },
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
            <div>
                <h4 className="text-xl font-bold text-green-300 flex items-center gap-2 mb-4">
                    <Package size={20} />
                    Products ({receipt.products?.length || 0})
                </h4>

                {productsLoading ? (
                    <LoadingSkeleton />
                ) : receipt.products && receipt.products.length > 0 ? (
                    <div className="space-y-2">
                        {receipt.products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                quantity={getProductQuantity(product.id)}
                                onClick={() => onProductClick?.(product)}
                                colorScheme="green"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-green-400">
                        No products available
                    </div>
                )}
            </div>
        </div>
    );
}