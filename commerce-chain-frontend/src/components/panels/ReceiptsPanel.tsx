import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { ReceiptsData, ReceiptData } from "../../utils/utils";

export default function ReceiptsPanel() {
  const [data, setData] = useState<ReceiptsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState<
      "create" | "storn" | "update" | "delete" | null
    >(null);
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
    const [viewDetails, setViewDetails] = useState(false);
  
    const fetchReceipts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8080/receipts/channel-a`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
  
        if (response.ok) {
          const responseData = await response.json();
          let parsedReceipts = [];
        if (responseData.Receipts) {
          try {
            parsedReceipts = JSON.parse(responseData.Receipts);
            if (!Array.isArray(parsedReceipts)) {
              parsedReceipts = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse receipts, defaulting to empty array ${parseError}`
            );
            parsedReceipts = [];
          }
        }

        const parsedData = {
          ...responseData,
          Receipts: parsedReceipts,
        };
        setData(parsedData);
        } else {
          const errorData = await response.json();
          setError(errorData.Message || "Failed to fetch receipts");
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
      fetchReceipts();
    }, []);
  
    const handleActionClick = (actionType: typeof action, receipt: ReceiptData) => {
      setSelectedReceipt(receipt);
      setAction(actionType);
    };
  
    const handleBackToList = () => {
      setAction(null);
      setSelectedReceipt(null);
      setViewDetails(false);
    };
  
    const renderContent = () => {
      if (action === "create") {
        // return <CreateReceiptForm onSuccess={fetchReceipts} />;
      }
      if (viewDetails && selectedReceipt) {
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-400">Receipt Details</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div>
                <span className="font-semibold text-green-300">ID:</span>{" "}
                {selectedReceipt.id}
              </div>
              <div>
                <span className="font-semibold text-green-300">User id:</span>{" "}
                {selectedReceipt["user-id"]}
              </div>
              <div>
                <span className="font-semibold text-green-300">Trader id:</span>{" "}
                {selectedReceipt["trader-id"]}
              </div>
            </div>
          </div>
        );
      }
      switch (action) {
        case "storn":
          return (
            <div className="text-gray-300">
              Increase quantity form for {selectedReceipt?.id}{" "}
              {selectedReceipt?.["user-id"]}
              {selectedReceipt?.["trader-id"]}
            </div>
          );
        case "update":
          return (
            <div className="text-gray-300">
              Update form for {selectedReceipt?.id} {selectedReceipt?.["user-id"]}
              {selectedReceipt?.["trader-id"]}
            </div>
          );
        case "delete":
          return (
            <div className="text-gray-300">
              Delete confirmation for {selectedReceipt?.id} {selectedReceipt?.["user-id"]}
              {selectedReceipt?.["trader-id"]}
            </div>
          );
        default:
          return null;
      }
    };
  
    if (action || viewDetails) {
      return (
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
          <button
            onClick={handleBackToList}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-300 font-semibold rounded border-2 border-gray-600 transition-all"
          >
            ← Back to Receipts
          </button>
          {renderContent()}
        </div>
      );
    }
  
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold text-green-400">Receipts</h3>
            <button
              onClick={() => setAction("create")}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50"
            >
              <Plus size={20} />
              Create Receipt
            </button>
          </div>
  
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
              <span className="font-semibold">{error}</span>
            </div>
          )}
  
          {loading ? (
            <div className="text-center text-green-300 py-8">
              Loading receipts...
            </div>
          ) : data && Array.isArray(data.Receipts) && data.Receipts.length > 0 ? (
            <div className="space-y-3">
              {data.Receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  onClick={() => {
                    setSelectedReceipt(receipt);
                    setViewDetails(true);
                  }}
                  className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50 cursor-pointer"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-green-300">
                      {receipt["user-id"]}
                    </h4>
                    <h4 className="font-bold text-lg text-green-300">
                      {receipt["trader-id"]}
                    </h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                    </div>
                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleActionClick("update", receipt)}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all"
                        title="Update"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleActionClick("delete", receipt)}
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
            <div className="text-center text-gray-400 py-8">No receipts found</div>
          )}
        </div>
      </div>
    );
}
