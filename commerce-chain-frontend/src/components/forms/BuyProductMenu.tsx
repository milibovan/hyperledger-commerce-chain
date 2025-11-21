import { useEffect, useState } from "react";
import type { UserData } from "../../utils/dataTypesUtils";
import type { AddOrBuyProductProps } from "../../utils/propsUtils";
import { userFontSemibold } from "../../utils/stylingUtils";
import { useProducts } from "../hooks/useProducts";
import { AlertCircle } from "lucide-react";
import ProductsTabs from "../overviews/ProductsTabs";
import { useTraders } from "../hooks/useTraders";

export default function BuyProduct({
  trader: user,
  onSuccess,
}: AddOrBuyProductProps<UserData>) {
  const { products, loading, fetchProducts } = useProducts();
  const {
    traders,
    products: availableProducts,
    fetchProductsByIds,
    fetchTraders,
  } = useTraders();
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(
    new Map()
  );

  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState<"available" | "request">(
    "available"
  );

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
  const remainingBalance = user.balance - totalCost;
  const hasInsufficientFunds = remainingBalance < 0;

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev: Map<string, number>) => {
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
    let product = undefined;

    if (activeTab === "available") {
      product = availableProducts.find((p) => p.id === productId);
    } else {
      product = products.find((p) => p.id === productId);
    }

    if (!product) return;

    setSelectedProducts((prev: Map<string, number>) => {
      const newMap = new Map(prev);
      newMap.set(productId, quantity);

      return newMap;
    });

    setErrors((prev) => {
      const newErrors = new Map(prev);
      if (quantity > product.quantity) {
        newErrors.set(productId, `Only ${product.quantity} available`);
      } else if (quantity < 0) {
        newErrors.set(productId, `Negative values aren't allowed`);
      } else {
        newErrors.delete(productId);
      }
      return newErrors;
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchTraders();
  }, [fetchProducts, fetchTraders]);

  useEffect(() => {
    if (traders.length > 0) {
      const productIds = traders.flatMap((trader) =>
        trader["products-available"].map((product) => product["product-id"])
      );

      fetchProductsByIds(productIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProductsByIds, traders.length]);

  const productQuantityMap = new Map<string, number>();

  traders.forEach((trader) => {
    trader["products-available"].forEach((inventoryItem) => {
      const productId = inventoryItem["product-id"];
      const quantity = inventoryItem.quantity;

      const currentTotal = productQuantityMap.get(productId) || 0;
      productQuantityMap.set(productId, currentTotal + quantity);
    });
  });

  availableProducts.forEach((availableProduct) => {
    const productId = availableProduct.id;

    const totalQuantity = productQuantityMap.get(productId) || 0;

    availableProduct.quantity = totalQuantity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-400 mb-2">
          Buy Products
        </h1>
        <p className="text-xl text-gray-300">
          <span className={userFontSemibold}>User:</span> {user.name}
        </p>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gray-800 border-2 border-purple-400 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-green-400">
              ${user.balance.toFixed(2)}
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
      <div className="flex gap-2 border-b-2 border-purple-500">
        <button
          onClick={() => {
            setActiveTab("available");
            setSelectedProducts(new Map());
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "available"
              ? "text-purple-300 border-b-4 border-purple-400 -mb-0.5"
              : "text-gray-400 hover:text-purple-300"
          }`}
        >
          🛒 Available Products
          <span className="ml-2 px-2 py-1 bg-green-600 rounded text-white text-xs">
            In Stock
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab("request");
            setSelectedProducts(new Map());
          }}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "request"
              ? "text-purple-300 border-b-4 border-purple-400 -mb-0.5"
              : "text-gray-400 hover:text-purple-300"
          }`}
        >
          📦 Request Items
          <span className="ml-2 px-2 py-1 bg-yellow-600 rounded text-white text-xs">
            Not Listed
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
        {activeTab === "available" ? (
          <ProductsTabs
            user={user}
            products={availableProducts}
            loading={loading}
            onSuccess={onSuccess}
            selectedProducts={selectedProducts}
            hasInsufficientFunds={hasInsufficientFunds}
            errors={errors}
            toggleProduct={toggleProduct}
            updateQuantity={updateQuantity}
            totalCost={totalCost}
            remainingBalance={remainingBalance}
          />
        ) : (
          <ProductsTabs
            user={user}
            products={products}
            loading={loading}
            onSuccess={onSuccess}
            selectedProducts={selectedProducts}
            hasInsufficientFunds={hasInsufficientFunds}
            errors={errors}
            toggleProduct={toggleProduct}
            updateQuantity={updateQuantity}
            totalCost={totalCost}
            remainingBalance={remainingBalance}
          />
        )}
      </div>
    </div>
  );
}
