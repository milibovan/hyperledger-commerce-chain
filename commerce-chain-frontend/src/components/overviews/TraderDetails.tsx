import type { TraderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import {
  traderFontBold,
  traderFontSemibold,
  createTraderButton,
} from "../../utils/stylingUtils";
import { Package, Plus, Receipt } from "lucide-react";

export default function TraderDetails({
  entity: trader,
  addProduct,
  onProductClick,
}: DetailsProps<TraderDetails>) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-pink-400">Trader Details</h3>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-b-2 border-pink-400">
        <div>
          <span className={traderFontSemibold}>ID:</span> {trader.trader.id}
        </div>
        <div>
          <span className={traderFontSemibold}>VAT:</span> {trader.trader.vat}
        </div>
        <div>
          <span className={traderFontSemibold}>Name:</span> {trader.trader.name}
        </div>
        <div>
          <span className={traderFontSemibold}>Balance:</span> $
          {trader.trader.balance.toFixed(2)}
        </div>
        <div>
          <span className={traderFontSemibold}>Type:</span>{" "}
          {trader.trader["trader-type"].toUpperCase()}
        </div>
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-pink-300 flex items-center gap-2">
            <Package size={20} />
            Products ({trader.trader["products-available"]?.length || 0})
          </h4>
          {addProduct && (
            <button
              onClick={() => addProduct(trader.trader!, trader["available-products"]!)}
              className={createTraderButton}
              title="Add products"
            >
              <Plus size={18} /> Add products
            </button>
          )}
        </div>

        {trader["available-products"] && trader["available-products"].length > 0 ? (
          <div className="space-y-2">
            {trader["available-products"].map((product) => {
              const quantity = trader["products-available"].find(productItem => product.id === productItem["product-id"])?.quantity
              return (
                <div
                  key={product.id}
                  onClick={() => onProductClick?.(product)}
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
        <h4 className="text-xl font-bold text-pink-300 mb-2 flex items-center gap-2">
          <Receipt size={20} />
          Receipts ({trader.trader["receipts-ids"]?.length || 0})
        </h4>
        {trader.trader["receipts-ids"]?.length > 0 ? (
          <div className="space-y-2">
            {trader.receipts.map((receipt) => (
              <div
                key={receipt}
                // onClick={() => onProductClick?.(receipt)}
                className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-pink-400 hover:shadow-lg hover:shadow-pink-400/50 hover:bg-gray-600"
              >
                <h5 className={traderFontSemibold}>{receipt}</h5>

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
