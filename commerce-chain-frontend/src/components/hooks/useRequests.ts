import { useCallback, useState } from "react";
import type { RequestDetails, RequestsData } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useRequests(channel: string = "channel-a") {
  const [data, setData] = useState<RequestsData | null>(null);
    const [detailedData, setDetailedData] = useState<RequestDetails>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/requests/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        let parsedRequests = [];
        if (responseData.Requests) {
          try {
            parsedRequests = JSON.parse(responseData.Requests);
            if (!Array.isArray(parsedRequests)) {
              parsedRequests = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse requests, defaulting to empty array`,
              parseError
            );
            parsedRequests = [];
          }
        }

        const parsedData = {
          ...responseData,
          Requests: parsedRequests,
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch requests");
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

  const fetchRequestDetails = useCallback(async (requestId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/requests/details/${requestId}/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
      const responseData = await response.json();
      
      const parsedData = {
        request: responseData.request,  
        products: responseData.products,
        receipts: responseData.receipts 
      };

      setDetailedData(parsedData);
    } else {
      const errorData = await response.json();
      setError(errorData.Message || "Failed to fetch request details");
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
  }, [channel])

  return {
    requests: data?.Requests || [],
    requestDetails: detailedData,
    loading,
    error,
    fetchRequests,
    fetchRequestDetails
  };
}
