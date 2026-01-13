import { Package, CheckCircle } from "lucide-react";
import type { ModalProps } from "../../utils/propsUtils";

interface ExtendedModalProps extends ModalProps {
  mode?: "RESTOCK" | "FULFILL";
}

export default function SuccessProductAddingModal({
  trader,
  selectedProducts,
  totalCost,
  remainingBalance,
  mode = "RESTOCK",
}: ExtendedModalProps) {
  const isRestock = mode === "RESTOCK";

  // Text Configuration
  const successTitle = isRestock ? "Success!" : "Order Fulfilled!";
  const successMessage = isRestock
    ? <span>Products have been successfully added to <span className="font-semibold text-green-300">{trader.name}</span>'s inventory!</span>
    : <span>Request successfully fulfilled for <span className="font-semibold text-green-300">{trader.name}</span>. Funds have been transferred.</span>;

  const itemsLabel = isRestock ? "Products Added:" : "Products Sold:";
  const costLabel = isRestock ? "Total Cost:" : "Total Revenue:";

  // For Restock, Cost is Red (Money out). For Fulfill, Revenue is Green (Money in).
  const costColor = isRestock ? "text-red-300" : "text-green-300";
  const displayCost = isRestock ? totalCost : totalCost; // Value is the same, color/label context changes

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-green-900/30 rounded-full">
          {isRestock ? <Package size={24} className="text-green-400" /> : <CheckCircle size={24} className="text-green-400" />}
        </div>
        <h2 className="text-2xl font-bold text-green-400">{successTitle}</h2>
      </div>

      <p className="text-gray-300 mb-4">
        {successMessage}
      </p>

      <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>{itemsLabel}</span>
            <span className="font-bold text-green-300">
              {selectedProducts.length}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>{costLabel}</span>
            <span className={`font-bold ${costColor}`}>
              ${displayCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>New Balance:</span>
            <span className="font-bold text-white">
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}