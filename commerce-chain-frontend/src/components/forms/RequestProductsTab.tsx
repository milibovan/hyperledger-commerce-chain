import { Send, ShoppingCart, Clock, Package } from "lucide-react";
import type { ProductsTabsProps } from "../../utils/propsUtils";
import { useRef, useState } from "react";
import type { ModalHandle } from "../modals/DeleteModal";
import Modal from "../modals/DeleteModal";
import { useEntityActions } from "../hooks/useEntityActions";
import { host, httpMethod } from "../../utils/utils";
import { userFontBold } from "../../utils/stylingUtils";
import type { ProductData } from "../../utils/dataTypesUtils";

interface ProductRequest {
    quantity: number;
    deliveryDays: number;
}

export default function RequestProductsTabs({
    user,
    products,
    loading,
    onSuccess,
}: ProductsTabsProps) {
    const { resetActions, resetNestedView } = useEntityActions();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Map of productId -> { quantity, deliveryDays }
    const [requestedProducts, setRequestedProducts] = useState<Map<string, ProductRequest>>(
        new Map()
    );
    const [errors, setErrors] = useState<Map<string, string>>(new Map());

    const confirmModalRef = useRef<ModalHandle>(null);
    const successModalRef = useRef<ModalHandle>(null);

    const getMinDeliveryDays = (product: ProductData): number => {
        return product.quantity > 0 ? 3 : 7; // In stock: 3 days, Out of stock: 7 days
    };

    const toggleProduct = (productId: string) => {
        setRequestedProducts((prev) => {
            const newMap = new Map(prev);
            if (newMap.has(productId)) {
                newMap.delete(productId);
                setErrors((prevErrors) => {
                    const newErrors = new Map(prevErrors);
                    newErrors.delete(productId);
                    return newErrors;
                });
            } else {
                const product = products.find((p) => p.id === productId);
                const minDays = getMinDeliveryDays(product!);
                newMap.set(productId, { quantity: 1, deliveryDays: minDays });
            }
            return newMap;
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        setRequestedProducts((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(productId);
            if (current) {
                newMap.set(productId, { ...current, quantity });
            }
            return newMap;
        });

        setErrors((prev) => {
            const newErrors = new Map(prev);
            if (quantity < 0) {
                newErrors.set(productId, "Negative values aren't allowed");
            } else if (quantity === 0) {
                newErrors.set(productId, "Quantity must be at least 1");
            } else {
                newErrors.delete(productId);
            }
            return newErrors;
        });
    };

    const updateDeliveryDays = (productId: string, days: number) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const minDays = getMinDeliveryDays(product);

        setRequestedProducts((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(productId);
            if (current) {
                newMap.set(productId, { ...current, deliveryDays: days });
            }
            return newMap;
        });

        setErrors((prev) => {
            const newErrors = new Map(prev);
            if (days < minDays) {
                newErrors.set(
                    productId,
                    `Minimum ${minDays} days required for ${product.quantity > 0 ? "in-stock" : "out-of-stock"} items`
                );
            } else {
                // Only clear delivery day errors, keep quantity errors if they exist
                const currentError = newErrors.get(productId);
                if (currentError?.includes("days required")) {
                    newErrors.delete(productId);
                }
            }
            return newErrors;
        });
    };

    const calculateTotal = (): number => {
        let total = 0;
        requestedProducts.forEach((request, productId) => {
            const product = products.find((p) => p.id === productId);
            if (product && request.quantity > 0) {
                total += product.price * request.quantity;
            }
        });
        return total;
    };

    const totalCost = calculateTotal();

    const handleSubmit = () => {
        if (errors.size > 0 || requestedProducts.size === 0) return;
        confirmModalRef.current?.open();
    };

    const handleConfirm = async () => {
        const requestsToSubmit = Array.from(requestedProducts.entries()).map(
            ([productId, request]) => ({
                "product-id": productId,
                quantity: request.quantity,
                "delivery-days": request.deliveryDays,
            })
        );

        setIsSubmitting(true);

        try {
            const response = await fetch(`${host}/order/request`, {
                method: httpMethod.POST,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "user-id": user.id,
                    requests: requestsToSubmit,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Success: ", data.Message);

                confirmModalRef.current?.close();

                if (onSuccess) {
                    await onSuccess();
                }

                successModalRef.current?.open();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to submit request");
                confirmModalRef.current?.close();
            }
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
            confirmModalRef.current?.close();
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitDisabled =
        loading || requestedProducts.size === 0 || errors.size > 0;

    return (
        <div>
            {/* Success Modal */}
            <Modal
                ref={successModalRef}
                onConfirm={() => {
                    successModalRef.current?.close();
                    resetNestedView();
                }}
                confirmLabel="Close"
                showActions={true}
                cancelClassName="hidden"
                confirmClassName="px-6 py-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50 text-white font-semibold"
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50 max-w-2xl w-full"
            >
                <div className="text-center">
                    <Package size={64} className="mx-auto mb-4 text-green-400" />
                    <h2 className="text-2xl font-bold text-green-400 mb-4">
                        Request Submitted Successfully!
                    </h2>
                    <p className="text-gray-300 mb-4">
                        Your product request has been submitted. You'll be notified when it's ready.
                    </p>
                    <div className="bg-gray-900 border border-green-500 rounded p-4">
                        <p className="text-sm text-gray-400">
                            Total Requested: <span className="text-white font-bold">{requestedProducts.size} product(s)</span>
                        </p>
                        <p className="text-sm text-gray-400">
                            Estimated Cost: <span className="text-yellow-400 font-bold">${totalCost.toFixed(2)}</span>
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                ref={confirmModalRef}
                onConfirm={handleConfirm}
                onCancel={() => confirmModalRef.current?.close()}
                confirmLabel={isSubmitting ? "Processing..." : "Submit Request"}
                cancelLabel="Review Again"
                confirmClassName="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 text-white font-semibold"
                cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-purple-300 font-semibold"
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50 max-w-3xl w-full"
            >
                <div>
                    <h2 className="text-2xl font-bold text-purple-400 mb-6">
                        Confirm Product Request
                    </h2>

                    <div className="bg-gray-900 border border-purple-500 rounded p-4 mb-4">
                        <p className="text-gray-300 mb-2">
                            <span className="font-semibold">User:</span> {user.name}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold">Current Balance:</span>{" "}
                            <span className="text-green-400">${user.balance.toFixed(2)}</span>
                        </p>
                        <p className="text-gray-300">
                            <span className="font-semibold">Estimated Cost:</span>{" "}
                            <span className="text-yellow-400">${totalCost.toFixed(2)}</span>
                        </p>
                    </div>

                    <div className="space-y-3 mb-4">
                        {Array.from(requestedProducts.entries()).map(([productId, request]) => {
                            const product = products.find((p) => p.id === productId);
                            if (!product) return null;

                            return (
                                <div key={productId} className="bg-gray-900 border border-gray-700 rounded p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-white">{product.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                                            </p>
                                        </div>
                                        <p className="text-purple-300 font-bold">
                                            ${(product.price * request.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p>Quantity: <span className="text-white font-semibold">{request.quantity}</span></p>
                                        <p>Delivery: <span className="text-white font-semibold">{request.deliveryDays} days</span></p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                        <p className="text-yellow-200 text-sm">
                            ⚠️ Note: This is a request. Funds will be reserved but not charged until the order is fulfilled.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Products Grid */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Available for Request ({products.length})
                </h2>

                {loading ? (
                    <div className="text-center text-purple-300 py-8">
                        Loading products...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product) => {
                            const isRequested = requestedProducts.has(product.id);
                            const request = requestedProducts.get(product.id);
                            const error = errors.get(product.id);
                            const productTotal = request ? product.price * request.quantity : 0;
                            const minDays = getMinDeliveryDays(product);
                            const isInStock = product.quantity > 0;

                            return (
                                <div
                                    key={product.id}
                                    className={`
                    border-2 rounded-lg p-4 transition-all duration-200
                    ${isRequested
                                            ? "bg-purple-900/20 border-purple-400 shadow-lg shadow-purple-400/20 cursor-pointer"
                                            : "bg-gray-800 border-gray-600 hover:border-purple-400/50 cursor-pointer"
                                        }
                  `}
                                    onClick={() => !isRequested && toggleProduct(product.id)}
                                >
                                    {/* Product Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className={userFontBold}>{product.name}</h3>
                                            <p className="text-xs text-gray-400">ID: {product.id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={userFontBold}>${product.price.toFixed(2)}</p>
                                            <div className="flex items-center gap-1 text-xs">
                                                {isInStock ? (
                                                    <span className="text-green-400 font-semibold flex items-center gap-1">
                                                        <Package size={12} />
                                                        In Stock
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-400 font-semibold flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details (shown when requested) */}
                                    {isRequested && request && (
                                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                            {/* Quantity Input */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-semibold text-purple-300 flex-shrink-0">
                                                    Quantity:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={request.quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(product.id, parseInt(e.target.value) || 0)
                                                    }
                                                    min="1"
                                                    className={`
                            flex-1 px-3 py-2 bg-gray-700 text-white rounded font-semibold
                            transition-all duration-200 focus:outline-none
                            ${error && error.includes("Quantity")
                                                            ? "border-2 border-red-500 focus:border-red-400"
                                                            : "border-2 border-purple-500 focus:border-purple-300"
                                                        }
                          `}
                                                />
                                            </div>

                                            {/* Delivery Days Input */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-semibold text-purple-300 flex-shrink-0">
                                                    <Clock size={14} className="inline mr-1" />
                                                    Days:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={request.deliveryDays}
                                                    onChange={(e) =>
                                                        updateDeliveryDays(product.id, parseInt(e.target.value) || minDays)
                                                    }
                                                    min={minDays}
                                                    className={`
                            flex-1 px-3 py-2 bg-gray-700 text-white rounded font-semibold
                            transition-all duration-200 focus:outline-none
                            ${error && error.includes("days")
                                                            ? "border-2 border-red-500 focus:border-red-400"
                                                            : "border-2 border-purple-500 focus:border-purple-300"
                                                        }
                          `}
                                                />
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    (min: {minDays})
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => toggleProduct(product.id)}
                                                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500 font-semibold text-sm transition-all"
                                            >
                                                Remove Request
                                            </button>

                                            {error && (
                                                <p className="text-xs text-red-400 font-semibold">{error}</p>
                                            )}

                                            {request.quantity > 0 && !error && (
                                                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                                    <span className="text-sm text-gray-400">Subtotal:</span>
                                                    <span className="text-lg font-bold text-purple-300">
                                                        ${productTotal.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isRequested && (
                                        <div className="text-center pt-2 border-t border-gray-700">
                                            <span className="text-sm text-purple-300 font-semibold">
                                                Click to request
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Min. {minDays} days delivery
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Requested Products Summary */}
            {requestedProducts.size > 0 && (
                <div className="bg-gray-800 border-2 border-purple-400 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-bold text-purple-300 mb-3">
                        Requested Products ({requestedProducts.size})
                    </h3>
                    <div className="space-y-2">
                        {Array.from(requestedProducts.entries()).map(([productId, request]) => {
                            const product = products.find((p) => p.id === productId);
                            if (!product) return null;
                            return (
                                <div
                                    key={productId}
                                    className="flex justify-between items-center text-sm text-gray-300"
                                >
                                    <span>
                                        {product.name} × {request.quantity}{" "}
                                        <span className="text-xs text-gray-500">
                                            ({request.deliveryDays}d)
                                        </span>
                                    </span>
                                    <span className="font-bold text-purple-300">
                                        ${(product.price * request.quantity).toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="pt-2 border-t border-purple-500 flex justify-between items-center">
                            <span className="font-bold text-white">Total Estimate:</span>
                            <span className="font-bold text-yellow-400 text-lg">
                                ${totalCost.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-purple-400">
                <button
                    onClick={resetActions}
                    className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-purple-300 font-bold rounded border-2 border-gray-600 transition-all duration-200"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-purple-300 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                >
                    <Send size={20} />
                    {loading ? "Submitting..." : `Request ${requestedProducts.size} Product(s)`}
                </button>
            </div>
        </div>
    );
}