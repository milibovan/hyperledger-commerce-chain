import { Package } from "lucide-react";
import { getFormattedDate, type ReceiptDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { receiptFontSemibold, SECTION_BORDER } from "../../utils/stylingUtils";
import LoadingSkeleton from "../reusables/LoadingSkeleton";
import InfoSection from "../reusables/InfoSection";
import ProductCard from "../reusables/ProductCard";

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
            <h3 className="text-2xl font-bold text-green-400">Receipt Details</h3>

            {/* Receipt Basic Info */}
            <div className={`grid grid-cols-1 gap-4 text-gray-300 py-4 ${SECTION_BORDER}`}>
                <div>
                    <span className={receiptFontSemibold}>ID:</span> {receipt.receipt.id}
                </div>
                <div>
                    <span className={receiptFontSemibold}>Date created:</span>{" "}
                    {getFormattedDate(receipt.receipt.date)}
                </div>
                <div>
                    <span className={receiptFontSemibold}>Total cost:</span> $
                    {receipt.receipt["total-cost"]}
                </div>
            </div>
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