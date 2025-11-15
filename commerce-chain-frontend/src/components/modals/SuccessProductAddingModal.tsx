import { Package } from "lucide-react";
import type { ModalProps } from "../../utils/propsUtils";

export default function SuccessProductAddingModal({
  trader,
  selectedProducts,
  totalCost,
  remainingBalance,
}: ModalProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-green-900/30 rounded-full">
          <Package size={24} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-green-400">Success!</h2>
      </div>

      <p className="text-gray-300 mb-4">
        Products have been successfully added to{" "}
        <span className="font-semibold text-green-300">{trader.name}</span>'s
        inventory!
      </p>

      <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Products Added:</span>
            <span className="font-bold text-green-300">
              {selectedProducts.size}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Total Cost:</span>
            <span className="font-bold text-red-300">
              ${totalCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>New Balance:</span>
            <span className="font-bold text-green-300">
              ${remainingBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
