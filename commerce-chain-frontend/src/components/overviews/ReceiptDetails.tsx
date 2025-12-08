import { Package } from "lucide-react";
import { getFormattedDate, type ReceiptDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { receiptFontBold, receiptFontSemibold } from "../../utils/stylingUtils";

export default function ReceiptDetails({ entity: receipt, productsLoading, onProductClick }: DetailsProps<ReceiptDetails>) {
    console.log(receipt)
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-green-400">Receipt Details</h3>
            <div className="grid grid-cols-1 gap-4 text-gray-300 pb-4 border-b-2 border-green-400">
                <div>
                    <span className="font-semibold text-green-300">ID:</span>{" "}
                    {receipt.receipt.id}
                </div>
                {/* // TODO user name surname and trader name and vat maybe */}
                <div>
                    <span className="font-semibold text-green-300">User id:</span>{" "}
                    {receipt.user.id}
                </div>
                <div>
                    <span className="font-semibold text-green-300">Trader id:</span>{" "}
                    {receipt.trader.id}
                </div>
                <div>
                    <span className="font-semibold text-green-300">Date created:</span>{" "}
                    {getFormattedDate(receipt.receipt.date)}
                </div>
                <div>
                    <span className="font-semibold text-green-300">Total cost:</span>{" "}
                    ${receipt.receipt["total-cost"]}
                </div>
            </div>
            {/* Products Section */}
            <div>
                <h4 className="text-xl font-bold text-green-300 flex items-center gap-2 mb-2">
                    <Package size={20} />
                    Products ({receipt.products?.length || 0})
                </h4>
                {productsLoading ? (
                    <div className="text-center text-green-300 py-4">
                        Loading products...
                    </div>
                ) : receipt.products && receipt.products.length > 0 ? (
                    <div className="space-y-2">
                        {receipt.products.map((product) => {
                            const quantity = receipt.receipt.products.find(productItem => product.id === productItem["product-id"])?.quantity
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => onProductClick?.(product)}
                                    className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-green-400 hover:shadow-lg hover:shadow-green-400/50 hover:bg-gray-600"
                                >
                                    <div className="flex-1">
                                        <h5 className={receiptFontSemibold}>{product.name}</h5>
                                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={receiptFontBold}>Quantity bought: {quantity}</p>
                                        <p className="text-xs text-gray-400">
                                            Expiry date:{" "}
                                            {new Date(product["expiry-date"]).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-green-400">
                        No products available
                    </div>
                )}
            </div>
        </div>
    )
}