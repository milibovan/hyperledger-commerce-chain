import { getFormattedDate, type ReceiptData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { receiptFontBold, receiptFontSemibold } from "../../utils/stylingUtils";

export default function ReceiptDetails({ entity: receipt }: DetailsProps<ReceiptData>) {
    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-400">Receipt Details</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                    <span className="font-semibold text-green-300">ID:</span>{" "}
                    {receipt.id}
                </div>
                <div>
                    <span className="font-semibold text-green-300">Date created:</span>{" "}
                    {getFormattedDate(receipt.date)}
                </div>
                <div>
                    <span className="font-semibold text-green-300">User id:</span>{" "}
                    {receipt["user-id"]}
                </div>
                <div>
                    <span className="font-semibold text-green-300">Trader id:</span>{" "}
                    {receipt["trader-id"]}
                </div>
            </div>
            <div className="pt-4 border-t-2 border-green-400">
                <h4 className="text-xl font-bold text-green-300 mb-2">
                    Products ({receipt.products?.length || 0})
                </h4>
                {receipt.products?.length > 0 ? (
                    <div className="space-y-2">
                        {receipt.products.map((product) => (
                            <div
                                key={product["product-id"]}
                                className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-green-400 hover:shadow-lg hover:shadow-green-400/50 hover:bg-gray-600"
                            >
                                <div className="flex-1">
                                    {/* TODO When fetched products */}
                                    {/* <h5 className={receiptFontSemibold}>{product.name}</h5> */}
                                    {/* <p className="text-xs text-gray-400">ID: {product["product-id"]}</p> */}
                                    <h5 className={receiptFontSemibold}>ID: {product["product-id"]}</h5>
                                </div>
                                <div className="text-right">
                                    <p className={receiptFontBold}>Quantity: {product.quantity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-green-400">
                        No receipts
                    </div>
                )}
            </div>
        </div>
    )
}