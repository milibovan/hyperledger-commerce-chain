import { useEffect, useState } from "react";
import type { ProductInventory, UserData } from "../../utils/dataTypesUtils";
import type { AddOrBuyProductProps } from "../../utils/propsUtils";
import { userFontSemibold } from "../../utils/stylingUtils";
import { useProducts } from "../hooks/useProducts";
import ProductsTabs from "../overviews/ProductsTabs";
import { useTraders } from "../hooks/useTraders";
import BalanceSummary from "../reusables/BalanceSummary";
import TabNavigation from "../reusables/TabNavigation";
import RequestProductsTabs from "../forms/RequestProductsTab";
import { Users } from "lucide-react";

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

  const [selectedProducts, setSelectedProducts] = useState<ProductInventory[]>([]);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState<"available" | "request">(
    "available"
  );

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
  const remainingBalance = user.balance - totalCost;
  const hasInsufficientFunds = remainingBalance < 0;

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.find(item => item["product-id"] === productId);

      if (exists) {
        setErrors((prevErrors) => {
          const newErrors = new Map(prevErrors);
          newErrors.delete(productId);
          return newErrors;
        });
        return prev.filter(item => item["product-id"] !== productId);
      } else {
        return [...prev, { "product-id": productId, quantity: 1 }];
      }
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

    if (quantity <= 0) {
      toggleProduct(productId);
      return;
    }

    setSelectedProducts((prev) =>
      prev.map(item =>
        item["product-id"] === productId
          ? { ...item, quantity }
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as "available" | "request");
    setSelectedProducts([]);
    setErrors(new Map());
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
  }, [fetchProductsByIds, traders]);

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

  const balanceItems = [
    {
      label: "Current Balance",
      value: `$${user.balance.toFixed(2)}`,
      colorClass: "text-green-400",
    },
    {
      label: "Total Cost",
      value: `-$${totalCost.toFixed(2)}`,
      colorClass: "text-yellow-400",
    },
    {
      label: "Remaining Balance",
      value: `$${remainingBalance.toFixed(2)}`,
      colorClass: hasInsufficientFunds ? "text-red-500" : "text-green-400",
    },
  ];

  const tabs = [
    {
      id: "available",
      label: "Available Products",
      icon: "🛒",
      badge: {
        text: "In Stock",
        colorClass: "bg-green-600",
      },
    },
    {
      id: "request",
      label: "Request Items",
      icon: "📦",
      badge: {
        text: "Not Listed",
        colorClass: "bg-yellow-600",
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-lg p-6 shadow-xl shadow-purple-500/30">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-900/30">
            <Users size={32} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-purple-400">
              Buy Products
            </h1>
            <p className="text-lg text-gray-300">
              <span className={userFontSemibold}>User:</span> {user.name}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <BalanceSummary
        items={balanceItems}
        showError={hasInsufficientFunds}
        errorMessage="Insufficient Funds! Reduce quantities or remove products."
      />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300"></div>

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
          <RequestProductsTabs
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