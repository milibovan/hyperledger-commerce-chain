import type { TraderData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import {
  traderFontBold,
  traderFontSemibold,
  addButtonStyle,
} from "../../utils/stylingUtils";
import { Package, Plus } from "lucide-react";

export default function TraderDetails({
  entity: trader,
  products,
  productsLoading,
  addProduct,
}: DetailsProps<TraderData>) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-pink-400">Trader Details</h3>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-b-2 border-pink-400">
        <div>
          <span className={traderFontSemibold}>ID:</span> {trader.id}
        </div>
        <div>
          <span className={traderFontSemibold}>VAT:</span> {trader.vat}
        </div>
        <div>
          <span className={traderFontSemibold}>Name:</span> {trader.name}
        </div>
        <div>
          <span className={traderFontSemibold}>Balance:</span> $
          {trader.balance.toFixed(2)}
        </div>
        <div>
          <span className={traderFontSemibold}>Type:</span>{" "}
          {trader["trader-type"].toUpperCase()}
        </div>
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-pink-300 flex items-center gap-2">
            <Package size={20} />
            Products ({trader["products-available"]?.length || 0})
          </h4>
          {addProduct && (
            <button
              onClick={() => addProduct(trader!, products!)}
              className={addButtonStyle}
              title="Add products"
            >
              <Plus size={18} /> Add products
            </button>
          )}
        </div>

        {productsLoading ? (
          <div className="text-center text-pink-300 py-4">
            Loading products...
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product) => {
              const quantity = trader["products-available"].find(productItem => product.id === productItem["product-id"])?.quantity
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-pink-400 hover:shadow-lg hover:shadow-pink-400/50 hover:bg-gray-600"
                >
                  <div className="flex-1">
                    <h5 className={traderFontSemibold}>{product.name}</h5>
                    <p className="text-xs text-gray-400">ID: {product.id}</p>
                  </div>
                  <div className="text-right">
                    <p className={traderFontBold}>Quantity: {quantity}</p>
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
          <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-pink-400">
            No products available
          </div>
        )}
      </div>

      {/* Receipts Section */}
      <div className="pt-4 border-t-2 border-pink-400">
        <h4 className="text-xl font-bold text-pink-300 mb-2">
          Receipts ({trader["receipts-ids"]?.length || 0})
        </h4>
        {trader["receipts-ids"]?.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {trader["receipts-ids"].map((receiptId) => (
              <div
                key={receiptId}
                className="px-3 py-2 bg-gray-700 rounded border border-pink-400 text-sm text-gray-300"
              >
                {receiptId}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-pink-400">
            No receipts
          </div>
        )}
      </div>
    </div>
  );
}
