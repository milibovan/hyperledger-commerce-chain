import { AlertCircle } from "lucide-react";
import type { BalanceSummaryProps } from "../../utils/propsUtils";

export default function BalanceSummary({
    items,
    errorMessage,
    showError = false,
}: BalanceSummaryProps) {
    return (
        <div className="bg-gray-800 border-2 border-purple-400 rounded-lg p-6 mb-6">
            <div className={`grid grid-cols-1 md:grid-cols-${items.length} gap-4 text-center`}>
                {items.map((item, index) => (
                    <div key={index}>
                        <p className="text-sm text-gray-400 mb-1">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.colorClass}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {showError && errorMessage && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-500 rounded text-red-300">
                    <AlertCircle size={20} />
                    <span className="font-semibold">{errorMessage}</span>
                </div>
            )}
        </div>
    );
}