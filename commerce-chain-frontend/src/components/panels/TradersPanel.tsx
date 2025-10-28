import { useState, useEffect } from "react";
import CreateTraderForm from "../forms/CreateTraderForm";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { TraderData, TradersData } from "../../utils/utils";

export default function TradersPanel() {
  const [data, setData] = useState<TradersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<
    "create" | "deposit_money" | "update" | "delete" | null
  >(null);
  const [selectedTrader, setSelectedTrader] = useState<TraderData | null>(null);
  const [viewDetails, setViewDetails] = useState(false);

  const fetchTraders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/traders/channel-a`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        const parsedData = {
          ...responseData,
          Traders: JSON.parse(responseData.Traders),
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

  useEffect(() => {
    fetchTraders();
  }, []);

  const handleActionClick = (actionType: typeof action, trader: TraderData) => {
    setSelectedTrader(trader);
    setAction(actionType);
  };

  const handleBackToList = () => {
    setAction(null);
    setSelectedTrader(null);
    setViewDetails(false);
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateTraderForm onSuccess={fetchTraders} />;
    }
    if (viewDetails && selectedTrader) {
      return (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-pink-400">Trader Details</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="font-semibold text-pink-300">ID:</span>{" "}
              {selectedTrader.id}
            </div>
            <div>
              <span className="font-semibold text-pink-300">Trader vat:</span>{" "}
              {selectedTrader.vat}
            </div>
            <div>
              <span className="font-semibold text-pink-300">Balance:</span> $
              {selectedTrader.balance.toFixed(2)}
            </div>
            <div>
              <span className="font-semibold text-pink-300">Trader type: </span>
              {selectedTrader["trader-type"].toUpperCase()}
            </div>
          </div>
        </div>
      );
    }
    switch (action) {
      case "deposit_money":
        return (
          <div className="text-gray-300">
            Deposit Money form for {selectedTrader?.id}{" "}
            {selectedTrader?.vat}
          </div>
        );
      case "update":
        return (
          <div className="text-gray-300">
            Update form for {selectedTrader?.id} {selectedTrader?.vat}
          </div>
        );
      case "delete":
        return (
          <div className="text-gray-300">
            Delete confirmation for {selectedTrader?.id} {selectedTrader?.vat}
          </div>
        );
      default:
        return null;
    }
  };

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
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
          <div className="flex gap-2 my-4 justify-end">
            <button
            //   onClick={() => handleActionClick("deposit_money", trader)}
              className="flex items-center mb-4 px-4 py-2 gap-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all text-white font-semibold"
              title="Deposit Money"
            >
              <Plus size={18} /> Deposit
            </button>
            <button
            //   onClick={() => handleActionClick("update", trader)}
              className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all  text-white font-semibold"
              title="Update"
            >
              <Edit size={18} /> Update
            </button>
            <button
            //   onClick={() => handleActionClick("delete", trader)}
              className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-red-600 hover:bg-red-500 rounded border-2 border-red-400 transition-all  text-white font-semibold"
              title="Delete"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                    {trader.vat}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {trader["trader-type"]}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className="font-bold text-pink-300">
                      ${trader.balance.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        handleActionClick("deposit_money", trader)
                      }
                      className="p-2 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all"
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
                      onClick={() => handleActionClick("delete", trader)}
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
