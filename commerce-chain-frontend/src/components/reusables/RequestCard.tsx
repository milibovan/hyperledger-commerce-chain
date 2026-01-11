import { getFormattedDate } from "../../utils/dataTypesUtils";
import type { RequestCardProps } from "../../utils/propsUtils";
import { Package, Calendar, DollarSign, CheckCircle, AlertTriangle, ShoppingCart, Plus } from "lucide-react";

export default function RequestCard({ request, onClick, trader, colorScheme = "purple" }: RequestCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    function couldBeFullfilled() {
        let hasEnoughProducts = true
        request.products.forEach((element) => {
            console.log(element)
            const tradersProduct = trader?.trader["products-available"].find(product => product["product-id"] === element["product-id"])
            console.log(tradersProduct)
            if (!tradersProduct) {
                hasEnoughProducts = false
            } else {
                if (element.quantity > tradersProduct.quantity) {
                    hasEnoughProducts = false
                }
            }
        })

        return hasEnoughProducts
    }

    const hasEnoughProducts = couldBeFullfilled();

    // Determine status styling
    const isCreated = request.status === 'CREATED';
    const isApproved = request.status === 'APPROVED';
    const isCompleted = request.status === 'COMPLETED';
    const isCancelled = request.status === 'CANCELLED';
    const isFulfilled = request.status === 'FULFILLED';

    // Theme colors
    const themeColors = {
        purple: {
            text: "text-purple-300",
            badge: "bg-purple-900/40 border-purple-500/50 text-purple-300",
            border: "border-purple-400",
            shadow: "hover:shadow-purple-400/50",
            ring: "focus:ring-purple-400",
            button: "bg-purple-600 hover:bg-purple-500 border-purple-400 text-white hover:shadow-purple-400/50"
        },
        pink: {
            text: "text-pink-300",
            badge: "bg-pink-900/40 border-pink-500/50 text-pink-300",
            border: "border-pink-400",
            shadow: "hover:shadow-pink-400/50",
            ring: "focus:ring-pink-400",
            button: "bg-pink-600 hover:bg-pink-500 border-pink-400 text-white hover:shadow-pink-400/50"
        },
        amber: {
            text: "text-amber-300",
            badge: "bg-amber-900/40 border-amber-500/50 text-amber-300",
            border: "border-amber-400",
            shadow: "hover:shadow-amber-400/50",
            ring: "focus:ring-amber-400",
            button: "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white hover:shadow-amber-400/50"
        }
    };

    const theme = themeColors[colorScheme];

    // Status badge styling
    const statusBadge = isCreated
        ? "bg-green-900/40 border-green-500/50 text-green-300"
        : isCompleted
            ? "bg-blue-900/40 border-blue-500/50 text-blue-300"
            : isCancelled
                ? "bg-red-900/40 border-red-500/50 text-red-300"
                : isApproved
                    ? "bg-amber-900/40 border-amber-500/50 text-amber-300"
                    : theme.badge;

    // Border and shadow colors based on fulfillment status
    const borderColor = !hasEnoughProducts && !isFulfilled && trader
        ? "border-red-500"
        : hasEnoughProducts && !isFulfilled && trader
            ? "border-green-500"
            : theme.border;

    const shadowColor = !hasEnoughProducts && !isFulfilled && trader
        ? "hover:shadow-red-500/50"
        : hasEnoughProducts && !isFulfilled && trader
            ? "hover:shadow-green-500/50"
            : theme.shadow;

    const focusRing = !hasEnoughProducts && !isFulfilled && trader
        ? "focus:ring-red-400"
        : hasEnoughProducts && !isFulfilled && trader
            ? "focus:ring-green-400"
            : theme.ring;

    return (
        <div className="space-y-2">
            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={handleKeyDown}
                className={`relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 ${borderColor} hover:shadow-xl ${shadowColor} cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 ${focusRing} hover:scale-[1.01]`}
                aria-label={`View details for request ${request.id}`}
            >
                {/* Decorative accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${hasEnoughProducts && !isFulfilled && trader ? "from-green-500 to-green-400" : !hasEnoughProducts && !isFulfilled && trader ? "from-red-500 to-red-400" : colorScheme === "purple" ? "from-purple-500 to-purple-400" : colorScheme === "pink" ? "from-pink-500 to-pink-400" : "from-amber-500 to-amber-400"}`}></div>

                <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${hasEnoughProducts && !isFulfilled && trader ? "bg-green-900/30" : !hasEnoughProducts && !isFulfilled && trader ? "bg-red-900/30" : colorScheme === "purple" ? "bg-purple-900/30" : colorScheme === "pink" ? "bg-pink-900/30" : "bg-amber-900/30"}`}>
                                <Package size={22} className={hasEnoughProducts && !isFulfilled && trader ? "text-green-400" : !hasEnoughProducts && !isFulfilled && trader ? "text-red-400" : theme.text} />
                            </div>
                            <div>
                                <h5 className={`font-bold text-lg ${theme.text}`}>
                                    {request.products.length} {request.products.length === 1 ? 'Product' : 'Products'}
                                </h5>
                                <p className="text-xs text-gray-500">ID: {request.id}</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusBadge} uppercase tracking-wide`}>
                            {request.status}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Total Cost */}
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Total Cost</p>
                                <p className={`font-bold text-lg ${theme.text}`}>
                                    ${request["total-cost"].toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">Created</p>
                                <p className="text-sm font-medium text-gray-300">
                                    {getFormattedDate(request["created-date"])}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Due Date - Full Width */}
                    <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded border border-gray-700">
                        <Calendar size={16} className="text-amber-400" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-400">Due Date</p>
                            <p className="text-sm font-semibold text-amber-300">
                                {getFormattedDate(request["due-date"])}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Section */}
            {!isFulfilled && trader && (
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${hasEnoughProducts ? "bg-green-900/20 border-green-500/50" : "bg-red-900/20 border-red-500/50"}`}>
                    <div className="flex items-center gap-3">
                        {hasEnoughProducts ? (
                            <>
                                <CheckCircle size={20} className="text-green-400" />
                                <div>
                                    <p className="font-semibold text-green-400">Ready to Fulfill</p>
                                    <p className="text-xs text-green-300/70">All products available in inventory</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle size={20} className="text-red-400" />
                                <div>
                                    <p className="font-semibold text-red-400">Insufficient Stock</p>
                                    <p className="text-xs text-red-300/70">Add products to fulfill this request</p>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add your fulfill/add products handler here
                        }}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg ${hasEnoughProducts
                            ? "bg-green-600 hover:bg-green-500 border-green-400 text-white hover:shadow-green-400/50"
                            : "bg-red-600 hover:bg-red-500 border-red-400 text-white hover:shadow-red-400/50"
                            }`}
                    >
                        {hasEnoughProducts ? (
                            <>
                                <ShoppingCart size={16} />
                                Fulfill
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Add Products
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}