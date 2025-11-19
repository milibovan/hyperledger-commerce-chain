import { useCallback, useState } from "react";
import type { ProductsData } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useProducts(channel: string = "channel-a") {
  const [data, setData] = useState<ProductsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/products/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
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
            console.warn(
              `Failed to parse products, defaulting to empty array`,
              parseError
            );
            parsedProducts = [];
          }
        }

        const parsedData = {
          ...responseData,
          Products: parsedProducts,
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch products");
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

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        const response = await fetch(`${host}/products/${channel}/${productId}`, {
          method: httpMethod.DELETE,
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          await fetchProducts();
          return { success: true };
        } else {
          const errorData = await response.json();
          const errorMsg = errorData.Message || "Failed to delete product";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = `Error deleting product: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [channel, fetchProducts]
  );

  return {
    products: data?.Products || [],
    loading,
    error,
    fetchProducts,
    deleteProduct,
  };
}
