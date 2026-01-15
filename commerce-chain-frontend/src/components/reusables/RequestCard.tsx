import { getFormattedDate, type ProductInventory } from "../../utils/dataTypesUtils";
import type { RequestCardProps } from "../../utils/propsUtils";
import { Package, Calendar, DollarSign, CheckCircle, AlertTriangle, ShoppingCart, Plus, XCircle, Wallet } from "lucide-react";
import type { ModalHandle } from "../modals/DeleteModal";
import { useRef, useState } from "react";
import { useEntityActions } from "../hooks/useEntityActions";
import TransactionModals, { type TransactionMode } from "../modals/TransactionModals"; // Updated Import
import { addProductsToTrader, fulfillRequest } from "../../utils/utils"; // Import your API calls

export default function RequestCard({ request, onClick, handleDeposit, trader, requestDetails, colorScheme = "purple" }: RequestCardProps) {
    const [transactionMode, setTransactionMode] = useState<TransactionMode>("RESTOCK");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault();
            onClick();
        }
    };

    function getSelectedProducts() {
        const availableStock = trader?.trader["products-available"] || [];

        return request.products
            .map((reqItem) => {
                const stockItem = availableStock.find(p => p["product-id"] === reqItem["product-id"]);
                const quantityOwned = stockItem?.quantity || 0;
                return {
                    "product-id": reqItem["product-id"],
                    quantity: reqItem.quantity - quantityOwned
                };
            })
            .filter((item) => item.quantity > 0);
    }

    function getTotalCost(products: ProductInventory[]) {
        let totalCost = 0;
        products.forEach((element) => {
            const tradersProduct = trader?.["available-products"].find(product => product.id === element["product-id"])
            if (tradersProduct) {
                totalCost += element.quantity * tradersProduct.price
            }
        })
        return totalCost
    }

    // Products needed for Restocking (Calculated diff)
    const restockProducts = getSelectedProducts();
    const restockCost = getTotalCost(restockProducts);

    // Products needed for Fulfillment (The full request)
    const fulfillProducts = request.products;
    const fulfillCost = request["total-cost"]; // Assuming this is pre-calculated on the request object

    // Dynamically choose which data to send to the modal based on mode
    const activeProducts = transactionMode === "RESTOCK" ? restockProducts : fulfillProducts;
    const activeCost = transactionMode === "RESTOCK" ? restockCost : fulfillCost;

    const successModalRef = useRef<ModalHandle>(null);
    const confirmModalRef = useRef<ModalHandle>(null);
    const { resetNestedView } = useEntityActions();

    function couldBeFullfilled() {
        let hasEnoughProducts = true
        request.products.forEach((element) => {
            const tradersProduct = trader?.trader["products-available"].find(product => product["product-id"] === element["product-id"])
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

    function hasEnoughQuantityStocked() {
        let hasEnoughQuantityStocked = true;
        request.products.forEach((reqItem) => {
            const globalProduct = trader?.["available-products"].find(p => p.id === reqItem["product-id"]);
            const ownedItem = trader?.trader["products-available"].find(p => p["product-id"] === reqItem["product-id"]);
            const quantityOwned = ownedItem ? ownedItem.quantity : 0;
            const quantityNeeded = Math.max(0, reqItem.quantity - quantityOwned);

            if (quantityNeeded > 0) {
                if (!globalProduct) {
                    hasEnoughQuantityStocked = false;
                }
                else if (globalProduct.quantity < quantityNeeded) {
                    hasEnoughQuantityStocked = false;
                }
            }
        });
        return hasEnoughQuantityStocked;
    }

    const hasEnoughProducts = couldBeFullfilled();
    const hasEnoughStocked = hasEnoughQuantityStocked();
    const hasSufficientBalance = trader ? trader.trader.balance >= restockCost : false;

    // Logic for action states
    const canFulfill = hasEnoughProducts;
    const canRestock = !hasEnoughProducts && hasEnoughStocked;
    const isGlobalStockMissing = !hasEnoughProducts && !hasEnoughStocked;

    // Theme and Status Badge Logic (kept same as your code)
    const isCreated = request.status === 'CREATED';
    const isApproved = request.status === 'APPROVED';
    const isCompleted = request.status === 'COMPLETED';
    const isCancelled = request.status === 'CANCELLED';
    const isFulfilled = request.status === 'FULFILLED';
    const isPending = request.status === "PENDING_FUNDS";

    const themeColors = {
        purple: { text: "text-purple-300", badge: "bg-purple-900/40 border-purple-500/50 text-purple-300", border: "border-purple-400", shadow: "hover:shadow-purple-400/50", ring: "focus:ring-purple-400", button: "bg-purple-600 hover:bg-purple-500 border-purple-400 text-white hover:shadow-purple-400/50" },
        pink: { text: "text-pink-300", badge: "bg-pink-900/40 border-pink-500/50 text-pink-300", border: "border-pink-400", shadow: "hover:shadow-pink-400/50", ring: "focus:ring-pink-400", button: "bg-pink-600 hover:bg-pink-500 border-pink-400 text-white hover:shadow-pink-400/50" },
        amber: { text: "text-amber-300", badge: "bg-amber-900/40 border-amber-500/50 text-amber-300", border: "border-amber-400", shadow: "hover:shadow-amber-400/50", ring: "focus:ring-amber-400", button: "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white hover:shadow-amber-400/50" }
    };

    const theme = themeColors[colorScheme];

    const statusBadge = isCreated ? "bg-green-900/40 border-green-500/50 text-green-300" : isCompleted ? "bg-blue-900/40 border-blue-500/50 text-blue-300" : isCancelled ? "bg-red-900/40 border-red-500/50 text-red-300" : isApproved ? "bg-amber-900/40 border-amber-500/50 text-amber-300" : theme.badge;

    const borderColor = isGlobalStockMissing && !isFulfilled && trader ? "border-red-500" : canRestock && !isFulfilled && trader ? hasSufficientBalance ? "border-amber-500" : "border-orange-600" : canFulfill && !isFulfilled && trader ? "border-green-500" : theme.border;
    const shadowColor = isGlobalStockMissing && !isFulfilled && trader ? "hover:shadow-red-500/50" : canRestock && !isFulfilled && trader ? hasSufficientBalance ? "hover:shadow-amber-500/50" : "hover:shadow-orange-600/50" : canFulfill && !isFulfilled && trader ? "hover:shadow-green-500/50" : theme.shadow;
    const focusRing = isGlobalStockMissing && !isFulfilled && trader ? "focus:ring-red-400" : canRestock && !isFulfilled && trader ? hasSufficientBalance ? "focus:ring-amber-400" : "focus:ring-orange-500" : canFulfill && !isFulfilled && trader ? "focus:ring-green-400" : theme.ring;

    // --- Action Handlers ---

    const handleOpenRestock = () => {
        setTransactionMode("RESTOCK");
        confirmModalRef.current?.open();
    };

    const handleOpenFulfill = () => {
        setTransactionMode("FULFILL");
        confirmModalRef.current?.open();
    };

    // This function returns the specific promise based on the active mode
    const executeTransaction = async () => {
        if (transactionMode === "RESTOCK") {
            // Call your Add Products API
            return await addProductsToTrader(activeProducts, trader!.trader.id);
        } else {
            // Call your Fulfill Request API (Placeholder example)
            // You will need to implement/import this function
            return await fulfillRequest(requestDetails!, trader!.trader)
        }
    };

    return (
        <div className="space-y-2">
            {trader && (
                <TransactionModals
                    successModalRef={successModalRef}
                    confirmModalRef={confirmModalRef}
                    resetNestedView={resetNestedView}
                    trader={trader.trader}
                    selectedProducts={activeProducts}
                    totalCost={activeCost}
                    products={trader["available-products"]}
                    mode={transactionMode}
                    onConfirmTransaction={executeTransaction}
                />
            )}

            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={handleKeyDown}
                className={`relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 ${borderColor} hover:shadow-xl ${shadowColor} cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 ${focusRing} hover:scale-[1.01]`}
                aria-label={`View details for request ${request.id}`}
            >
                {/* Decorative accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${canFulfill && !isFulfilled && trader ? "from-green-500 to-green-400" : isGlobalStockMissing && !isFulfilled && trader ? "from-red-500 to-red-400" : canRestock && !isFulfilled && trader ? (hasSufficientBalance ? "from-amber-500 to-amber-400" : "from-orange-600 to-orange-500") : colorScheme === "purple" ? "from-purple-500 to-purple-400" : colorScheme === "pink" ? "from-pink-500 to-pink-400" : "from-amber-500 to-amber-400"}`}></div>

                <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${canFulfill && !isFulfilled && trader ? "bg-green-900/30" : isGlobalStockMissing && !isFulfilled && trader ? "bg-red-900/30" : canRestock && !isFulfilled && trader ? (hasSufficientBalance ? "bg-amber-900/30" : "bg-orange-900/30") : colorScheme === "purple" ? "bg-purple-900/30" : colorScheme === "pink" ? "bg-pink-900/30" : "bg-amber-900/30"}`}>
                                <Package size={22} className={canFulfill && !isFulfilled && trader ? "text-green-400" : isGlobalStockMissing && !isFulfilled && trader ? "text-red-400" : canRestock && !isFulfilled && trader ? (hasSufficientBalance ? "text-amber-400" : "text-orange-400") : theme.text} />
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
            {!isFulfilled && !isPending && trader && (
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${canFulfill ? "bg-green-900/20 border-green-500/50" :
                    canRestock
                        ? (hasSufficientBalance ? "bg-amber-900/20 border-amber-500/50" : "bg-orange-900/20 border-orange-600/50")
                        : "bg-red-900/20 border-red-500/50"
                    }`}>
                    <div className="flex items-center gap-3">
                        {canFulfill ? (
                            <>
                                <CheckCircle size={20} className="text-green-400" />
                                <div>
                                    <p className="font-semibold text-green-400">Ready to Fulfill</p>
                                    <p className="text-xs text-green-300/70">All products available in inventory</p>
                                </div>
                            </>
                        ) : canRestock ? (
                            hasSufficientBalance ? (
                                <>
                                    <AlertTriangle size={20} className="text-amber-400" />
                                    <div>
                                        <p className="font-semibold text-amber-400">Insufficient Stock</p>
                                        <p className="text-xs text-amber-300/70">
                                            Restock Cost: ${restockCost.toFixed(0)} | Bal: ${trader.trader.balance.toFixed(0)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <DollarSign size={20} className="text-orange-400" />
                                    <div>
                                        <p className="font-semibold text-orange-400">Insufficient Funds</p>
                                        <p className="text-xs text-orange-300/70">
                                            Cost: ${restockCost.toFixed(0)} | Bal: ${trader.trader.balance.toFixed(0)}
                                        </p>
                                    </div>
                                </>
                            )
                        ) : (
                            <>
                                <XCircle size={20} className="text-red-400" />
                                <div>
                                    <p className="font-semibold text-red-400">Global Stock Missing</p>
                                    <p className="text-xs text-red-300/70">
                                        Est. Cost: ${restockCost.toFixed(0)} | Bal: ${trader.trader.balance.toFixed(0)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (canFulfill) {
                                handleOpenFulfill();
                            } else if (canRestock) {
                                if (hasSufficientBalance) {
                                    handleOpenRestock();
                                } else {
                                    handleDeposit!();
                                }
                            }
                        }}
                        disabled={isGlobalStockMissing}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold rounded border-2 transition-all duration-200 ${canFulfill
                            ? "bg-green-600 hover:bg-green-500 border-green-400 text-white hover:shadow-lg hover:shadow-green-400/50"
                            : canRestock
                                ? (hasSufficientBalance
                                    ? "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white hover:shadow-lg hover:shadow-amber-400/50"
                                    : "bg-orange-800 hover:bg-orange-700 border-orange-600 text-orange-200 hover:shadow-lg hover:shadow-orange-600/30"
                                )
                                : "bg-red-900/40 border-red-500/50 text-red-300 cursor-not-allowed opacity-80"
                            }`}
                    >
                        {canFulfill ? (
                            <>
                                <ShoppingCart size={16} />
                                Fulfill
                            </>
                        ) : canRestock ? (
                            hasSufficientBalance ? (
                                <>
                                    <Plus size={16} />
                                    Add Products
                                </>
                            ) : (
                                <>
                                    <Wallet size={16} />
                                    Low Balance
                                </>
                            )
                        ) : (
                            <>
                                <XCircle size={16} />
                                Unavailable
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}