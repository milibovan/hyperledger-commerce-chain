import { Package } from "lucide-react";
import type { ModalProps } from "../../utils/propsUtils";
import { isUserData } from "../../utils/dataTypesUtils";

export default function ConfirmationModal({
  trader,
  selectedProducts,
  totalCost,
  remainingBalance,
  products,
}: ModalProps) {
  const isUser = isUserData(trader);
  const themeColor = isUser ? "purple" : "pink";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 bg-${themeColor}-900/30 rounded-full`}>
          <Package size={24} className={`text-${themeColor}-400`} />
        </div>
        <h2 className={`text-2xl font-bold text-${themeColor}-400`}>Confirm Purchase</h2>
      </div>

      <p className="text-gray-300 mb-6">
        You are about to add the following products to{" "}
        <span className={`font-semibold text-${themeColor}-300`}>{trader.name}</span>'s
        inventory:
      </p>

      {/* Products List in Modal */}
      <div className={`bg-gray-900/50 border border-${themeColor}-500/30 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto`}>
        <div className="space-y-3">
          {selectedProducts.map((item) => {
            const productId = item["product-id"];
            const quantity = item.quantity;

            const product = products?.find((p) => p.id === productId);
            if (!product) return null;
            const itemTotal = product.price * quantity;

            return (
              <div
                key={productId}
                className={`flex items-center justify-between p-3 bg-gray-800/50 rounded border border-${themeColor}-500/20`}
              >
                <div className="flex-1">
                  <h4 className={`font-semibold text-${themeColor}-300`}>
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    ${product.price.toFixed(2)} × {quantity} units
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-${themeColor}-300`}>
                    ${itemTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Summary */}
      <div className={`bg-${themeColor}-900/20 border-2 border-${themeColor}-500 rounded-lg p-4`}>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Current Balance:</span>
            <span className="font-semibold">${trader.balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-yellow-400">
            <span>Total Cost:</span>
            <span className="font-bold">-${totalCost.toFixed(2)}</span>
          </div>
          <div className={`h-px bg-${themeColor}-500/30 my-2`}></div>
          <div className="flex justify-between text-lg">
            <span className={`font-semibold text-${themeColor}-300`}>New Balance:</span>
            <span className="font-bold text-green-400">
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center">
        This will update your inventory and deduct funds from your balance.
      </p>
    </div>
  );
}
