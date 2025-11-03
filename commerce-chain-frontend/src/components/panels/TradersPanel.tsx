import { useState, useEffect, useRef } from "react";
import CreateTraderForm from "../forms/CreateTraderForm";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import type { TraderData, TradersData, ProductData } from "../../utils/dataTypesUtils";
import DepositMoneyForm from "../forms/DepositMoneyForm";
import UpdateTraderForm from "../forms/UpdateTraderForm";
import Modal from "../forms/DeleteModal";
import type { ModalHandle } from "../forms/DeleteModal";
import { host, httpMethod } from "../../utils/utils";
import { addButtonStyle, addButtonStyleSm, traderFontBold, traderFontSemibold } from "../../utils/stylingUtils";

export default function TradersPanel() {
  const [data, setData] = useState<TradersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [traderProducts, setTraderProducts] = useState<ProductData[]>([]);
  const [action, setAction] = useState<"create" | "deposit" | "update" | null>(
    null
  );
  const [selectedTrader, setSelectedTrader] = useState<TraderData | null>(null);
  const [viewDetails, setViewDetails] = useState(false);
  const modalRef = useRef<ModalHandle>(null);

  const fetchTraders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/traders/channel-a`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        let parsedTraders = [];
        if (responseData.Traders) {
          try {
            parsedTraders = JSON.parse(responseData.Traders);
            if (!Array.isArray(parsedTraders)) {
              parsedTraders = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse traders, defaulting to empty array`,
              parseError
            );
            parsedTraders = [];
          }
        }

        const parsedData = {
          ...responseData,
          Traders: parsedTraders,
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch traders");
      }
    } catch (err) {
      setError(
        `Error connecting to server: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTraderProducts = async (trader: TraderData) => {
    // Don't fetch if no products
    if (
      !trader["products-available-ids"] ||
      trader["products-available-ids"].length === 0
    ) {
      setTraderProducts([]);
      return;
    }

    setProductsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${host}/products/channel-a/by-ids`,
        {
          method: httpMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productIds: trader["products-available-ids"],
          }),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        let parsedProducts = [];

        if (responseData.Products) {
          try {
            parsedProducts = JSON.parse(responseData.Products);
            if (!Array.isArray(parsedProducts)) {
              parsedProducts = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse products, defaulting to empty array`,
              parseError
            );
            parsedProducts = [];
          }
        }

        setTraderProducts(parsedProducts);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch products");
        setTraderProducts([]);
      }
    } catch (err) {
      setError(
        `Error fetching products: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setTraderProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch traders on mount
  useEffect(() => {
    fetchTraders();
  }, []);

  // Fetch products when trader is selected and details view is shown
  useEffect(() => {
    if (selectedTrader && viewDetails) {
      fetchTraderProducts(selectedTrader);
    } else {
      setTraderProducts([]);
    }
  }, [selectedTrader, viewDetails]);

  const handleActionClick = (actionType: typeof action, trader: TraderData) => {
    setSelectedTrader(trader);
    setAction(actionType);
    setViewDetails(false); // Close details when starting an action
  };

  const handleBackToList = () => {
    setAction(null);
    setSelectedTrader(null);
    setViewDetails(false);
    setTraderProducts([]);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${host}/traders/channel-a/${selectedTrader?.id}`,
        {
          method: httpMethod.DELETE,
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        modalRef.current?.close();
        setSelectedTrader(null);
        setViewDetails(false);
        setTraderProducts([]);
        await fetchTraders();
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to delete trader");
        modalRef.current?.close();
      }
    } catch (err) {
      setError(
        `Error deleting trader: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      modalRef.current?.close();
    }
  };

  const handleDeleteClick = (trader: TraderData) => {
    setSelectedTrader(trader);
    modalRef.current?.open();
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateTraderForm onSuccess={fetchTraders} />;
    }

    switch (action) {
      case "deposit":
        return (
          <DepositMoneyForm
            user={selectedTrader!}
            onSuccess={fetchTraders}
            handleBackToList={handleBackToList}
          />
        );
      case "update":
        return (
          <UpdateTraderForm
            trader={selectedTrader!}
            onSuccess={fetchTraders}
            handleActionClick={handleActionClick}
            handleBackToList={handleBackToList}
          />
        );
      default:
        if (viewDetails && selectedTrader) {
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-pink-400">
                Trader Details
              </h3>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-b-2 border-pink-400">
                <div>
                  <span className={traderFontSemibold}>ID:</span>{" "}
                  {selectedTrader.id}
                </div>
                <div>
                  <span className={traderFontSemibold}>VAT:</span>{" "}
                  {selectedTrader.vat}
                </div>
                <div>
                  <span className={traderFontSemibold}>Name:</span>{" "}
                  {selectedTrader.name}
                </div>
                <div>
                  <span className={traderFontSemibold}>Balance:</span>{" "}
                  ${selectedTrader.balance.toFixed(2)}
                </div>
                <div>
                  <span className={traderFontSemibold}>Type:</span>{" "}
                  {selectedTrader["trader-type"].toUpperCase()}
                </div>
              </div>

              {/* Products Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-pink-300 flex items-center gap-2">
                    <Package size={20} />
                    Products (
                    {selectedTrader["products-available-ids"]?.length || 0})
                  </h4>
                  <button
                    // onClick={() => handleActionClick("deposit", selectedTrader!)}
                    className={addButtonStyle}
                    title="Add products"
                  >
                    <Plus size={18} /> Add products
                  </button>
                </div>

                {productsLoading ? (
                  <div className="text-center text-pink-300 py-4">
                    Loading products...
                  </div>
                ) : traderProducts.length > 0 ? (
                  <div className="space-y-2">
                    {traderProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-pink-400"
                      >
                        <div className="flex-1">
                          <h5 className={traderFontSemibold}>
                            {product.name}
                          </h5>
                          <p className="text-xs text-gray-400">
                            ID: {product.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={traderFontBold}>
                            ${product.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(
                              product["expiry-date"]
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-pink-400">
                    No products available
                  </div>
                )}
              </div>

              {/* Receipts Section */}
              <div className="pt-4 border-t-2 border-pink-400">
                <h4 className="text-xl font-bold text-pink-300 mb-2">
                  Receipts ({selectedTrader["receipts-ids"]?.length || 0})
                </h4>
                {selectedTrader["receipts-ids"]?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedTrader["receipts-ids"].map((receiptId) => (
                      <div
                        key={receiptId}
                        className="px-3 py-2 bg-gray-700 rounded border border-pink-400 text-sm text-gray-300"
                      >
                        {receiptId}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-pink-400">
                    No receipts
                  </div>
                )}
              </div>
            </div>
          );
        }
    }
  };

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDelete}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmClassName="px-6 py-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all duration-200 hover:shadow-lg hover:shadow-red-400/50 text-white font-semibold"
          cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-pink-300 font-semibold"
          dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50 max-w-2xl w-full"
        >
          <h2 className="text-2xl font-bold text-pink-400 mb-4">
            Confirm Deletion
          </h2>
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className={traderFontSemibold}>
              {selectedTrader?.name} {selectedTrader?.["trader-type"]}
            </span>
            ?
          </p>
          <p className="text-sm text-gray-400 mt-2">ID: {selectedTrader?.id}</p>
          <p className="text-sm text-red-400 mt-4">
            This action cannot be undone.
          </p>
        </Modal>
        <div className="flex justify-between items-center mb-6">
          <div
            className="flex gap-2 my-4 justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBackToList}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-pink-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Traders
            </button>
          </div>
          {action === null && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                onClick={() => handleActionClick("deposit", selectedTrader!)}
                className={addButtonStyle + " mb-4"}
                title="Deposit Money"
              >
                <Plus size={18} /> Deposit
              </button>
              <button
                onClick={() => handleActionClick("update", selectedTrader!)}
                className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all  text-white font-semibold"
                title="Update"
              >
                <Edit size={18} /> Update
              </button>
              <button
                onClick={() => handleDeleteClick(selectedTrader!)}
                className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all  text-white font-semibold"
                title="Delete"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal
        ref={modalRef}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmClassName="px-6 py-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all duration-200 hover:shadow-lg hover:shadow-red-400/50 text-white font-semibold"
        cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-pink-300 font-semibold"
        dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50 max-w-2xl w-full"
      >
        <h2 className="text-2xl font-bold text-pink-400 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className={traderFontSemibold}>
            {selectedTrader?.name} {selectedTrader?.["trader-type"]}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedTrader?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-pink-400">Traders</h3>
          <button
            onClick={() => setAction("create")}
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50"
          >
            <Plus size={20} />
            Create Trader
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-pink-300 py-8">
            Loading traders...
          </div>
        ) : data && Array.isArray(data.Traders) && data.Traders.length > 0 ? (
          <div className="space-y-3">
            {data.Traders.map((trader) => (
              <div
                key={trader.id}
                onClick={() => {
                  setSelectedTrader(trader);
                  setViewDetails(true);
                }}
                className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 cursor-pointer"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-pink-300">
                    {trader.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {trader["trader-type"]}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className={traderFontBold}>
                      ${trader.balance.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleActionClick("deposit", trader)}
                      className={addButtonStyleSm}
                      title="Deposit Money"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => handleActionClick("update", trader)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all"
                      title="Update"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(trader)}
                      className="p-2 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">No traders found</div>
        )}
      </div>
    </div>
  );
}
