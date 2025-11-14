import { useEffect, useRef, useState } from "react";
import { Send, ShoppingCart, AlertCircle, Package } from "lucide-react";
import type { AddProductProps } from "../../utils/propsUtils";
import { useProducts } from "../customHooks/useProducts";
import { traderFontBold, traderFontSemibold } from "../../utils/stylingUtils";
import { useEntityActions } from "../customHooks/useEntityActions";
import Modal, { type ModalHandle } from "./DeleteModal";
import { host, httpMethod } from "../../utils/utils";

// interface SelectedProduct {
//   productId: string;
//   quantity: number;
// }

export default function AddProductsToTrader({ trader }: AddProductProps) {
  const successModalRef = useRef<ModalHandle>(null);
  const { products, loading, fetchProducts } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(
    new Map()
  );
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const { resetActions } = useEntityActions();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const calculateTotal = (): number => {
    let total = 0;
    selectedProducts.forEach((quantity, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product && quantity > 0) {
        total += product.price * quantity;
      }
    });
    return total;
  };

  const totalCost = calculateTotal();
  const remainingBalance = trader.balance - totalCost;
  const hasInsufficientFunds = remainingBalance < 0;

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(productId)) {
        newMap.delete(productId);
        setErrors((prevErrors) => {
          const newErrors = new Map(prevErrors);
          newErrors.delete(productId);
          return newErrors;
        });
      } else {
        newMap.set(productId, 1);
      }
      return newMap;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (quantity > 0) {
        newMap.set(productId, quantity);
      } else {
        newMap.delete(productId);
      }
      return newMap;
    });

    setErrors((prev) => {
      const newErrors = new Map(prev);
      if (quantity > product.quantity) {
        newErrors.set(productId, `Only ${product.quantity} available`);
      } else {
        newErrors.delete(productId);
      }
      return newErrors;
    });
  };

  const handleConfirm = async () => {
    const productsToAdd = Array.from(selectedProducts.entries()).map(
      ([productId, quantity]) => ({
        "product-id": productId,
        quantity,
      })
    );

    try {
      // Your API call here
      const response = await fetch(
        `${host}/traders-products/channel-a`,
        {
          method: httpMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: productsToAdd,
            "trader-id": trader.id
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Data: ", data.Message)
        successModalRef.current?.close();
        resetActions();
        // Show success message or redirect
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to add products");
        successModalRef.current?.close();
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      successModalRef.current?.close();
    }
  };

  const handleSubmit = () => {
    if (hasInsufficientFunds || errors.size > 0 || selectedProducts.size === 0)
      return;
    successModalRef.current?.open();
  };

  const isSubmitDisabled =
    loading ||
    selectedProducts.size === 0 ||
    hasInsufficientFunds ||
    errors.size > 0;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <Modal
        ref={successModalRef}
        onConfirm={handleConfirm}
        onCancel={() => successModalRef.current?.close()}
        confirmLabel="Confirm Purchase"
        cancelLabel="Review Again"
        confirmClassName="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 text-white font-semibold"
        cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-pink-300 font-semibold"
        dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50 max-w-3xl w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-pink-900/30 rounded-full">
            <Package size={24} className="text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-pink-400">Confirm Purchase</h2>
        </div>

        <p className="text-gray-300 mb-6">
          You are about to add the following products to{" "}
          <span className="font-semibold text-pink-300">{trader.name}</span>'s
          inventory:
        </p>

        {/* Products List in Modal */}
        <div className="bg-gray-900/50 border border-pink-500/30 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          <div className="space-y-3">
            {Array.from(selectedProducts.entries()).map(
              ([productId, quantity]) => {
                const product = products.find((p) => p.id === productId);
                if (!product) return null;
                const itemTotal = product.price * quantity;

                return (
                  <div
                    key={productId}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-pink-500/20"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-pink-300">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        ${product.price.toFixed(2)} × {quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-300">
                        ${itemTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-pink-900/20 border-2 border-pink-500 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Current Balance:</span>
              <span className="font-semibold">
                ${trader.balance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-yellow-400">
              <span>Total Cost:</span>
              <span className="font-bold">-${totalCost.toFixed(2)}</span>
            </div>
            <div className="h-px bg-pink-500/30 my-2"></div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-pink-300">New Balance:</span>
              <span className="font-bold text-green-400">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-4 text-center">
          This will update your inventory and deduct funds from your balance.
        </p>
      </Modal>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-pink-400 mb-2">
          Add Products to Trader
        </h1>
        <p className="text-xl text-gray-300">
          <span className={traderFontSemibold}>Trader:</span> {trader.name}
        </p>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gray-800 border-2 border-pink-400 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-green-400">
              ${trader.balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-yellow-400">
              -${totalCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Remaining Balance</p>
            <p
              className={`text-2xl font-bold ${
                hasInsufficientFunds ? "text-red-500" : "text-green-400"
              }`}
            >
              ${remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {hasInsufficientFunds && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-500 rounded text-red-300">
            <AlertCircle size={20} />
            <span className="font-semibold">
              Insufficient Funds! Reduce quantities or remove products.
            </span>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-pink-300 mb-4 flex items-center gap-2">
          <ShoppingCart size={20} />
          Available Products ({products.length})
        </h2>

        {loading ? (
          <div className="text-center text-pink-300 py-8">
            Loading products...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const quantity = selectedProducts.get(product.id) || 0;
              const error = errors.get(product.id);
              const productTotal = product.price * quantity;

              return (
                <div
                  key={product.id}
                  className={`
                      border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer
                      ${
                        isSelected
                          ? "bg-pink-900/20 border-pink-400 shadow-lg shadow-pink-400/20"
                          : "bg-gray-800 border-gray-600 hover:border-pink-400/50"
                      }
                    `}
                  onClick={() => !isSelected && toggleProduct(product.id)}
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={traderFontBold}>{product.name}</h3>
                      <p className="text-xs text-gray-400">ID: {product.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={traderFontBold}>
                        ${product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Stock: {product.quantity - quantity}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Input (shown when selected) */}
                  {isSelected && (
                    <div
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-pink-300 flex-shrink-0">
                          Quantity:
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) =>
                            updateQuantity(
                              product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                          max={product.quantity}
                          className={`
                              flex-1 px-3 py-2 bg-gray-700 text-white rounded font-semibold
                              transition-all duration-200 focus:outline-none
                              ${
                                error || (hasInsufficientFunds && quantity > 0)
                                  ? "border-2 border-red-500 focus:border-red-400"
                                  : "border-2 border-pink-500 focus:border-pink-300"
                              }
                            `}
                        />
                        <button
                          onClick={() => toggleProduct(product.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500 font-semibold text-sm transition-all"
                        >
                          Remove
                        </button>
                      </div>

                      {error && (
                        <p className="text-xs text-red-400 font-semibold">
                          {error}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-sm text-gray-400">Subtotal:</span>
                        <span
                          className={`text-lg font-bold ${
                            hasInsufficientFunds && quantity > 0
                              ? "text-red-400"
                              : "text-pink-300"
                          }`}
                        >
                          ${productTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isSelected && (
                    <div className="text-center pt-2 border-t border-gray-700">
                      <span className="text-sm text-pink-300 font-semibold">
                        Click to add
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.size > 0 && (
        <div className="bg-gray-800 border-2 border-pink-400 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-pink-300 mb-3">
            Selected Products ({selectedProducts.size})
          </h3>
          <div className="space-y-2">
            {Array.from(selectedProducts.entries()).map(
              ([productId, quantity]) => {
                const product = products.find((p) => p.id === productId);
                if (!product) return null;
                return (
                  <div
                    key={productId}
                    className="flex justify-between items-center text-sm text-gray-300"
                  >
                    <span>
                      {product.name} × {quantity}
                    </span>
                    <span className="font-bold text-pink-300">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t-2 border-pink-400">
        <button
          onClick={resetActions}
          className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-pink-300 font-bold rounded border-2 border-gray-600 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-pink-300 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
        >
          <Send size={20} />
          {loading ? "Adding..." : `Add ${selectedProducts.size} Product(s)`}
        </button>
      </div>
    </div>
  );
}
