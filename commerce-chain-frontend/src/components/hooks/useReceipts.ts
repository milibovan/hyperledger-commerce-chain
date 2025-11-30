import { useCallback, useState } from "react";
import type { ReceiptsData } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useReceipts(channel: string = "channel-a") {
  const [data, setData] = useState<ReceiptsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/receipts/${channel}`, {
        method: httpMethod.GET,
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
              `Failed to parse receipts, defaulting to empty array`,
              parseError
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
  }, [channel]);

  const deleteReceipt = useCallback(
    async (receiptId: string) => {
      try {
        const response = await fetch(`${host}/receipts/${channel}/${receiptId}`, {
          method: httpMethod.DELETE,
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          await fetchReceipts();
          return { success: true };
        } else {
          const errorData = await response.json();
          const errorMsg = errorData.Message || "Failed to delete receipt";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = `Error deleting receipt: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [channel, fetchReceipts]
  );

  return {
    receipts: data?.Receipts || [],
    loading,
    error,
    fetchReceipts,
    deleteReceipt,
  };
}
