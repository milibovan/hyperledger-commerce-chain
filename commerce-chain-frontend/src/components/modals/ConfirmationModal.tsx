import { Package, CheckCircle2 } from "lucide-react";
import type { ModalProps } from "../../utils/propsUtils";
import { isUserData } from "../../utils/dataTypesUtils";

// Extend the props to include the mode
interface ExtendedModalProps extends ModalProps {
  mode?: "RESTOCK" | "FULFILL";
}

export default function ConfirmationModal({
  trader,
  selectedProducts,
  totalCost,
  remainingBalance,
  products,
  mode = "RESTOCK", // Default to RESTOCK for backward compatibility
}: ExtendedModalProps) {
  const isUser = isUserData(trader);
  const isRestock = mode === "RESTOCK";

  // Dynamic Theme Logic
  // RESTOCK: Pink (if user) / Purple (if trader)
  // FULFILL: Green (Always, implies success/money coming in)
  const themeColor = !isRestock
    ? "green"
    : isUser
      ? "purple"
      : "pink";

  const title = isRestock ? "Confirm Purchase" : "Confirm Fulfillment";

  const description = isRestock
    ? <span>You are about to add the following products to <span className={`font-semibold text-${themeColor}-300`}>{trader.name}</span>'s inventory:</span>
    : <span>You are about to fulfill a request for <span className={`font-semibold text-${themeColor}-300`}>{trader.name}</span> containing:</span>;

  const costLabel = isRestock ? "Total Cost:" : "Total Revenue:";
  const costSign = isRestock ? "-" : "+";
  const costTextColor = isRestock ? "text-red-400" : "text-green-400"; // Red for spending, Green for earning

  const footerText = isRestock
    ? "This will update inventory and deduct funds from the balance."
    : "This will remove items from inventory and add funds to the balance.";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 bg-${themeColor}-900/30 rounded-full`}>
          {isRestock ? (
            <Package size={24} className={`text-${themeColor}-400`} />
          ) : (
            <CheckCircle2 size={24} className={`text-${themeColor}-400`} />
          )}
        </div>
        <h2 className={`text-2xl font-bold text-${themeColor}-400`}>{title}</h2>
      </div>

      <p className="text-gray-300 mb-6">
        {description}
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
          <div className="flex justify-between">
            <span className="text-gray-300">{costLabel}</span>
            <span className={`font-bold ${costTextColor}`}>
              {costSign}${totalCost.toFixed(2)}
            </span>
          </div>
          <div className={`h-px bg-${themeColor}-500/30 my-2`}></div>
          <div className="flex justify-between text-lg">
            <span className={`font-semibold text-${themeColor}-300`}>New Balance:</span>
            <span className="font-bold text-white">
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center">
        {footerText}
      </p>
    </div>
  );
}