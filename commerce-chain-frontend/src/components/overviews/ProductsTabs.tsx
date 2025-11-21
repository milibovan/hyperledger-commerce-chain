import { Send, ShoppingCart } from "lucide-react";
import type { ProductsTabsProps } from "../../utils/propsUtils";
import { useRef, useState } from "react";
import type { ModalHandle } from "../modals/DeleteModal";
import Modal from "../modals/DeleteModal";
import { useEntityActions } from "../hooks/useEntityActions";
import { host, httpMethod } from "../../utils/utils";
import { userFontBold } from "../../utils/stylingUtils";
import ConfirmationModal from "../modals/ConfirmationModal";
import SuccessProductAddingModal from "../modals/SuccessProductAddingModal";

export default function ProductsTabs({
  user,
  products,
  loading,
  onSuccess,
  selectedProducts,
  hasInsufficientFunds,
  errors,
  toggleProduct,
  updateQuantity,
  totalCost,
  remainingBalance
}: ProductsTabsProps) {
  const { resetActions, resetNestedView } = useEntityActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successModalRef = useRef<ModalHandle>(null);
  const confirmModalRef = useRef<ModalHandle>(null);

  const handleConfirm = async () => {
    const productsToAdd = Array.from(selectedProducts.entries()).map(
      ([productId, quantity]) => ({
        "product-id": productId,
        quantity,
      })
    );

    const receipt = {
      "user-id": user.id,
      products: productsToAdd,
      date: new Date(),
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${host}/receipt/channel-a`, {
        method: httpMethod.POST,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt,
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
        alert(errorData.error || "Failed to create receipt");
        successModalRef.current?.close();
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
      successModalRef.current?.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (hasInsufficientFunds || errors.size > 0 || selectedProducts.size === 0)
      return;
    confirmModalRef.current?.open();
  };

  const isSubmitDisabled =
    loading ||
    selectedProducts.size === 0 ||
    hasInsufficientFunds ||
    errors.size > 0;

  return (
    <div>
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
        <SuccessProductAddingModal
          trader={user}
          selectedProducts={selectedProducts}
          totalCost={totalCost}
          remainingBalance={remainingBalance}
        />
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        ref={confirmModalRef}
        onConfirm={handleConfirm}
        onCancel={() => confirmModalRef.current?.close()}
        confirmLabel={isSubmitting ? "Processing..." : "Confirm Purchase"}
        cancelLabel="Review Again"
        confirmClassName="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 text-white font-semibold"
        cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-purple-300 font-semibold"
        dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50 max-w-3xl w-full"
      >
        <ConfirmationModal
          trader={user}
          selectedProducts={selectedProducts}
          totalCost={totalCost}
          remainingBalance={remainingBalance}
          products={products}
        />
      </Modal>
      {/* Products Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
          <ShoppingCart size={20} />
          All Products ({products.length})
        </h2>

        {loading ? (
          <div className="text-center text-purple-300 py-8">
            Loading products...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const quantity = selectedProducts.get(product.id) || 0;
              const error = errors.get(product.id);
              const productTotal = product.price * quantity;
              const isOutOfStock = product.quantity === 0;

              return (
                <div
                  key={product.id}
                  className={`
                      border-2 rounded-lg p-4 transition-all duration-200
                      ${
                        isOutOfStock
                          ? "bg-gray-900/50 border-gray-700 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-purple-900/20 border-purple-400 shadow-lg shadow-purple-400/20 cursor-pointer"
                          : "bg-gray-800 border-gray-600 hover:border-purple-400/50 cursor-pointer"
                      }
                    `}
                  onClick={() =>
                    !isSelected && !isOutOfStock && toggleProduct(product.id)
                  }
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={userFontBold}>{product.name}</h3>
                      <p className="text-xs text-gray-400">ID: {product.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={userFontBold}>
                        ${product.price.toFixed(2)}
                      </p>
                      <p
                        className={`text-xs ${
                          isOutOfStock
                            ? "text-red-400 font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        Stock: {quantity >= 0 && product.quantity - quantity}
                      </p>
                    </div>
                  </div>

                  {/* Out of Stock Badge */}
                  {isOutOfStock && (
                    <div className="text-center pt-2 border-t border-gray-700">
                      <span className="text-sm text-red-400 font-semibold">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Quantity Input (shown when selected) */}
                  {isSelected && !isOutOfStock && (
                    <div
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-purple-300 flex-shrink-0">
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
                          max={product.quantity}
                          className={`
                              flex-1 px-3 py-2 bg-gray-700 text-white rounded font-semibold
                              transition-all duration-200 focus:outline-none
                              ${
                                error ||
                                (hasInsufficientFunds && quantity > 0) ||
                                quantity < 0
                                  ? "border-2 border-red-500 focus:border-red-400"
                                  : "border-2 border-purple-500 focus:border-purple-300"
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

                      {quantity > 0 && product.quantity > quantity && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-sm text-gray-400">
                            Subtotal:
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              hasInsufficientFunds && quantity > 0
                                ? "text-red-400"
                                : "text-purple-300"
                            }`}
                          >
                            ${productTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isSelected && !isOutOfStock && (
                    <div className="text-center pt-2 border-t border-gray-700">
                      <span className="text-sm text-purple-300 font-semibold">
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
      {selectedProducts.size > 0 &&
        [...selectedProducts.values()].every((quantity) => quantity > 0) && (
          <div className="bg-gray-800 border-2 border-purple-400 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-purple-300 mb-3">
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
                      <span className="font-bold text-purple-300">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

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
          {loading ? "Buying..." : `Buy ${selectedProducts.size} Product(s)`}
        </button>
      </div>
    </div>
  );
}
