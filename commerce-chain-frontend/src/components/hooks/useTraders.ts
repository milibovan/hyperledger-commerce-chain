import { useCallback, useState } from "react";
import type { TradersData, ProductData, TraderDetails } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useTraders(channel: string = "channel-a") {
  const [data, setData] = useState<TradersData | null>(null);
  const [detailedData, setDetailedData] = useState<TraderDetails>();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTraders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/traders/${channel}`, {
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
  }, [channel]);

  const deleteTrader = useCallback(
    async (traderId: string) => {
      try {
        const response = await fetch(`${host}/traders/${channel}/${traderId}`, {
          method: httpMethod.DELETE,
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          await fetchTraders();
          return { success: true };
        } else {
          const errorData = await response.json();
          const errorMsg = errorData.Message || "Failed to delete trader";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = `Error deleting trader: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [channel, fetchTraders]
  );

  const fetchProductsByIds = useCallback(
    async (productIds: string[]) => {
      if (!productIds || productIds.length === 0) {
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${host}/traders/${channel}/products`, {
          method: httpMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "product-ids": productIds }),
        });

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
              console.warn("Failed to parse products", parseError);
              parsedProducts = [];
            }
          }

          setProducts(parsedProducts);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch products");
          setProducts([]);
        }
      } catch (err) {
        setError(
          `Error fetching products: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [channel]
  );

  const clearProducts = useCallback(() => {
    setProducts([]);
    setError(null);
  }, []);

  const fetchTraderDetails = useCallback(async (traderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/traders/details/${traderId}/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
      const responseData = await response.json();
      
      const parsedData = {
        trader: responseData.trader,  
        receipts: responseData.receipts,
        "receipts-products": responseData["receipts-products"],
        "available-products": responseData["available-products"],
        requests: responseData.requests,
        "available-requests": responseData["available-requests"],
      };

      setDetailedData(parsedData);
    } else {
      const errorData = await response.json();
      setError(errorData.Message || "Failed to fetch trader details");
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
    traders: data?.Traders || [],
    traderDetails: detailedData,
    products: products,
    loading,
    error,
    fetchTraders,
    fetchProductsByIds,
    fetchTraderDetails,
    clearProducts,
    deleteTrader,
  };
}
