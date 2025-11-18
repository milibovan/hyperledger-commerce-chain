import { useEffect, useState } from "react";
import type { UserData } from "../../utils/dataTypesUtils";
import type { AddOrBuyProductProps } from "../../utils/propsUtils";
import { userFontSemibold } from "../../utils/stylingUtils";
import { useProducts } from "../customHooks/useProducts";
// import { AlertCircle } from "lucide-react";
import AvailableProducts from "../overviews/AvailableProducts";
import RequestProducts from "../overviews/RequestProducts";

export default function BuyProduct({
  trader: user,
  onSuccess,
}: AddOrBuyProductProps<UserData>) {
  const { products, loading, fetchProducts } = useProducts();

  const [activeTab, setActiveTab] = useState<"available" | "request">(
    "available"
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
              {/* -${totalCost.toFixed(2)} */}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Remaining Balance</p>
            <p
            // className={`text-2xl font-bold ${
            //   hasInsufficientFunds ? "text-red-500" : "text-green-400"
            // }`}
            >
              {/* ${remainingBalance.toFixed(2)} */}
            </p>
          </div>
        </div>

        {/* {hasInsufficientFunds && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-500 rounded text-red-300">
            <AlertCircle size={20} />
            <span className="font-semibold">
              Insufficient Funds! Reduce quantities or remove products.
            </span>
          </div>
        )} */}
      </div>
      <div className="flex gap-2 border-b-2 border-purple-500">
        <button
          onClick={() => setActiveTab("available")}
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
          onClick={() => setActiveTab("request")}
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
          <AvailableProducts />
        ) : (
          <RequestProducts
            user={user}
            products={products}
            loading={loading}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
