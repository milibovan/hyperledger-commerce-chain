import { getFormattedDate } from "../../utils/dataTypesUtils";
import type { ProductCardProps } from "../../utils/propsUtils";
import { Package, Calendar, Hash, AlertTriangle, CheckCircle } from "lucide-react";

export default function ProductCard({ product, quantity, onClick, colorScheme = "green" }: ProductCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    const isOutOfStock = quantity === 0;
    const isLowStock = quantity !== undefined && quantity > 0 && quantity <= 5;

    // Theme colors
    const themeColors = {
        green: {
            text: "text-green-300",
            badge: "bg-green-900/40 border-green-500/50 text-green-300",
            border: "border-green-400",
            shadow: "hover:shadow-green-400/50",
            ring: "focus:ring-green-400",
            accent: "from-green-500 to-green-400",
            bgLight: "bg-green-900/30"
        },
        pink: {
            text: "text-pink-300",
            badge: "bg-pink-900/40 border-pink-500/50 text-pink-300",
            border: "border-pink-400",
            shadow: "hover:shadow-pink-400/50",
            ring: "focus:ring-pink-400",
            accent: "from-pink-500 to-pink-400",
            bgLight: "bg-pink-900/30"
        },
        indigo: {
            text: "text-indigo-300",
            badge: "bg-indigo-900/40 border-indigo-500/50 text-indigo-300",
            border: "border-indigo-400",
            shadow: "hover:shadow-indigo-400/50",
            ring: "focus:ring-indigo-400",
            accent: "from-indigo-500 to-indigo-400",
            bgLight: "bg-indigo-900/30"
        },
        amber: {
            text: "text-amber-300",
            badge: "bg-amber-900/40 border-amber-500/50 text-amber-300",
            border: "border-amber-400",
            shadow: "hover:shadow-amber-400/50",
            ring: "focus:ring-amber-400",
            accent: "from-amber-500 to-amber-400",
            bgLight: "bg-amber-900/30"
        }
    };

    const theme = themeColors[colorScheme];

    // Override border and shadow for out of stock
    const borderColor = isOutOfStock ? "border-red-500" : theme.border;
    const shadowColor = isOutOfStock ? "hover:shadow-red-500/50" : theme.shadow;
    const focusRing = isOutOfStock ? "focus:ring-red-400" : theme.ring;
    const accentGradient = isOutOfStock ? "from-red-500 to-red-400" : theme.accent;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 ${borderColor} hover:shadow-xl ${shadowColor} cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 ${focusRing} hover:scale-[1.01]`}
            aria-label={`View details for ${product.name}`}
        >
            {/* Decorative accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient}`}></div>

            <div className="p-4">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isOutOfStock ? "bg-red-900/30" : theme.bgLight}`}>
                            <Package size={20} className={isOutOfStock ? "text-red-400" : theme.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className={`font-bold text-base ${theme.text} truncate`}>
                                {product.name}
                            </h5>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Hash size={12} />
                                {product.id}
                            </div>
                        </div>
                    </div>

                    {/* Stock Status Badge */}
                    {quantity !== undefined && colorScheme === 'pink' && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isOutOfStock
                            ? "bg-red-900/40 border-red-500/50 text-red-300"
                            : isLowStock
                                ? "bg-yellow-900/40 border-yellow-500/50 text-yellow-300"
                                : "bg-green-900/40 border-green-500/50 text-green-300"
                            }`}>
                            {isOutOfStock ? (
                                <>
                                    <AlertTriangle size={12} />
                                    Out of Stock
                                </>
                            ) : isLowStock ? (
                                <>
                                    <AlertTriangle size={12} />
                                    Low Stock
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={12} />
                                    In Stock
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="flex items-center justify-between gap-4">
                    {/* Quantity */}
                    {quantity !== undefined && (
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Quantity</p>
                                <p className={`font-bold text-lg ${isOutOfStock
                                    ? "text-red-400"
                                    : isLowStock
                                        ? "text-yellow-400"
                                        : theme.text
                                    }`}>
                                    {quantity}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Expiry Date */}
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Expiry Date</p>
                            <p className="text-sm font-medium text-gray-300">
                                {getFormattedDate(product["expiry-date"])}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}