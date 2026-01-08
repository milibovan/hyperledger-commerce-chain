import { getFormattedDate } from "../../utils/dataTypesUtils";
import type { RequestCardProps } from "../../utils/propsUtils";

export default function RequestCard({ request, onClick, colorScheme = "purple" }: RequestCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    // Determine status styling
    const isCreated = request.status === 'CREATED';
    const isCompleted = request.status === 'COMPLETED';
    const isCancelled = request.status === 'CANCELLED';

    // Status color logic
    const statusColor = isCreated
        ? "text-green-300"
        : isCompleted
            ? "text-blue-300"
            : isCancelled
                ? "text-red-300"
                : "text-purple-300";

    // Border and shadow colors based on colorScheme
    const borderColor = colorScheme === "pink"
        ? "border-pink-400"
        : "border-purple-400";

    const shadowColor = colorScheme === "pink"
        ? "hover:shadow-pink-400/50"
        : "hover:shadow-purple-400/50";

    const focusRing = colorScheme === "pink"
        ? "focus:ring-pink-400"
        : "focus:ring-purple-400";

    const textColor = colorScheme === "pink"
        ? "text-pink-300"
        : "text-purple-300";

    const fontBold = `font-bold ${textColor}`;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`flex items-center justify-between px-4 py-3 bg-gray-700 rounded border ${borderColor} hover:shadow-lg ${shadowColor} hover:bg-gray-600 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 ${focusRing}`}
            aria-label={`View details for request ${request.id}`}
        >
            <div className="flex-1">
                <h5 className={fontBold}>
                    Products requested: {request.products.length}
                </h5>
                <h5 className={`font-bold ${statusColor}`}>
                    Request status: {request.status}
                </h5>
                <p className="text-xs text-gray-400">ID: {request.id}</p>
            </div>
            <div className="text-right">
                <p className={fontBold}>
                    Total cost: ${request["total-cost"].toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                    Request created: {getFormattedDate(request["created-date"])}
                </p>
                <p className="text-xs text-gray-400">
                    Request expires: {getFormattedDate(request["due-date"])}
                </p>
            </div>
        </div>
    );
}