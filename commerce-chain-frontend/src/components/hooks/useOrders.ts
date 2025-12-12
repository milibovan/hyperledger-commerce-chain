import { useCallback, useState } from "react";
import type { OrderDetails, OrdersData } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useOrders(channel: string = "channel-a") {
  const [data, setData] = useState<OrdersData | null>(null);
    const [detailedData, setDetailedData] = useState<OrderDetails>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/orders/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        let parsedOrders = [];
        if (responseData.Orders) {
          try {
            parsedOrders = JSON.parse(responseData.Orders);
            if (!Array.isArray(parsedOrders)) {
              parsedOrders = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse orders, defaulting to empty array`,
              parseError
            );
            parsedOrders = [];
          }
        }

        const parsedData = {
          ...responseData,
          Orders: parsedOrders,
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch orders");
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

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/orders/details/${orderId}/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
      const responseData = await response.json();
      
      const parsedData = {
        order: responseData.order,  
        products: responseData.products,
        receipts: responseData.receipts 
      };

      setDetailedData(parsedData);
    } else {
      const errorData = await response.json();
      setError(errorData.Message || "Failed to fetch order details");
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
    orders: data?.Orders || [],
    orderDetails: detailedData,
    loading,
    error,
    fetchOrders,
    fetchOrderDetails
  };
}
