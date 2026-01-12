import { useEffect, useRef, useState } from "react";
import { Send, ShoppingCart, AlertCircle, Package, DollarSign, TrendingUp } from "lucide-react";
import type { AddOrBuyProductProps } from "../../utils/propsUtils";
import { useProducts } from "../hooks/useProducts";
import { traderFontBold, traderFontSemibold } from "../../utils/stylingUtils";
import { useEntityActions } from "../hooks/useEntityActions";
import { type ModalHandle } from "../modals/DeleteModal";
import type { ProductInventory, TraderData } from "../../utils/dataTypesUtils";
import AddProductToTraderModals from "../modals/AddProductToTraderModals";


export default function AddProductsToTrader({
  trader,
}: AddOrBuyProductProps<TraderData>) {
  const successModalRef = useRef<ModalHandle>(null);
  const confirmModalRef = useRef<ModalHandle>(null);
  const { products, loading, fetchProducts } = useProducts();

  const [selectedProducts, setSelectedProducts] = useState<ProductInventory[]>([]);

  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const { resetActions, resetNestedView } = useEntityActions();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const calculateTotal = (): number => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find((p) => p.id === item["product-id"]);
      if (product && item.quantity > 0) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const totalCost = calculateTotal();
  const remainingBalance = trader.balance - totalCost;
  const hasInsufficientFunds = remainingBalance < 0;

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((item) => item["product-id"] === productId);

      if (exists) {
        setErrors((prevErrors) => {
          const newErrors = new Map(prevErrors);
          newErrors.delete(productId);
          return newErrors;
        });
        return prev.filter((item) => item["product-id"] !== productId);
      } else {
        return [...prev, { "product-id": productId, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      toggleProduct(productId);
      return;
    }

    setSelectedProducts((prev) =>
      prev.map((item) =>
        item["product-id"] === productId
          ? { ...item, quantity: quantity }
          : item
      )
    );

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

  const handleSubmit = () => {
    if (hasInsufficientFunds || errors.size > 0 || selectedProducts.length === 0)
      return;
    confirmModalRef.current?.open();
  };

  const isSubmitDisabled =
    loading ||
    selectedProducts.length === 0 ||
    hasInsufficientFunds ||
    errors.size > 0;

  return (
    <div className="space-y-6">
      <AddProductToTraderModals
        successModalRef={successModalRef}
        confirmModalRef={confirmModalRef}
        resetNestedView={resetNestedView}
        trader={trader}
        selectedProducts={selectedProducts}
        totalCost={totalCost}
        balance={remainingBalance}
        products={products}
      />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-500 rounded-lg p-6 shadow-xl shadow-pink-500/30">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-400"></div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-pink-900/30">
            <TrendingUp size={32} className="text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-pink-400">
              Add Products to Trader
            </h1>
            <p className="text-lg text-gray-300">
              <span className={traderFontSemibold}>Trader:</span> {trader.name}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-400 rounded-lg p-6 shadow-lg shadow-pink-400/20">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign size={16} className="text-gray-400" />
              <p className="text-sm text-gray-400">Current Balance</p>
            </div>
            <p className="text-2xl font-bold text-green-400">
              ${trader.balance.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingCart size={16} className="text-gray-400" />
              <p className="text-sm text-gray-400">Total Cost</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              -${totalCost.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign size={16} className="text-gray-400" />
              <p className="text-sm text-gray-400">Remaining Balance</p>
            </div>
            <p
              className={`text-2xl font-bold ${hasInsufficientFunds ? "text-red-500" : "text-green-400"}`}
            >
              ${remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {hasInsufficientFunds && (
          <div className="relative overflow-hidden mt-4 px-4 py-3 bg-red-900/40 border-2 border-red-500 rounded-lg">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-pink-400"></div>
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle size={20} />
              <span className="font-semibold">
                Insufficient Funds! Reduce quantities or remove products.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-400 rounded-lg p-6 shadow-lg shadow-pink-400/20">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300"></div>

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
              // CHANGED: Find product in array
              const selection = selectedProducts.find(p => p["product-id"] === product.id);
              const isSelected = !!selection;
              const quantity = selection?.quantity || 0;

              const error = errors.get(product.id);
              const productTotal = product.price * quantity;

              return (
                <div
                  key={product.id}
                  className={`relative overflow-hidden rounded-lg p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${isSelected
                    ? "bg-gradient-to-br from-pink-900/30 to-pink-900/20 border-2 border-pink-400 shadow-lg shadow-pink-400/30"
                    : "bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 hover:border-pink-400/50"
                    }`}
                  onClick={() => !isSelected && product.quantity > 0 && toggleProduct(product.id)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 ${isSelected ? "opacity-100" : "opacity-0"}`}></div>

                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="p-1.5 rounded bg-pink-900/30">
                        <Package size={16} className="text-pink-400" />
                      </div>
                      <div>
                        <h3 className={traderFontBold}>{product.name}</h3>
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                      </div>
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
                          className={`flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 focus:outline-none ${error || (hasInsufficientFunds && quantity > 0)
                            ? "border-2 border-red-500 focus:border-red-400"
                            : "border-2 border-pink-500 focus:border-pink-300"
                            }`}
                        />
                        <button
                          onClick={() => toggleProduct(product.id)}
                          className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg border-2 border-red-500 font-semibold text-sm transition-all"
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
                          className={`text-lg font-bold ${hasInsufficientFunds && quantity > 0
                            ? "text-red-400"
                            : "text-pink-300"
                            }`}
                        >
                          ${productTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isSelected && product.quantity > 0 && (
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
      {selectedProducts.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-400 rounded-lg p-4 shadow-lg shadow-pink-400/20">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300"></div>
          <h3 className="text-lg font-bold text-pink-300 mb-3">
            Selected Products ({selectedProducts.length})
          </h3>
          <div className="space-y-2">
            {/* CHANGED: Map over the array directly */}
            {selectedProducts.map((item) => {
              const product = products.find((p) => p.id === item["product-id"]);
              if (!product) return null;
              return (
                <div
                  key={item["product-id"]}
                  className="flex justify-between items-center p-2 bg-gray-800/50 rounded border border-gray-700"
                >
                  <span className="text-sm text-gray-300">
                    {product.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-pink-300">
                    ${(product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            }
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={resetActions}
          className="relative overflow-hidden flex-1 py-3 px-6 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-pink-300 font-bold rounded-lg border-2 border-gray-600 hover:border-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-pink-400/20"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-500 to-gray-600"></div>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-bold text-lg rounded-lg border-2 border-pink-400 transition-all duration-300 hover:shadow-xl hover:shadow-pink-400/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-300 to-pink-200"></div>
          <Send size={20} />
          {loading ? "Adding..." : `Add ${selectedProducts.length} Product(s)`}
        </button>
      </div>
    </div>
  );
}