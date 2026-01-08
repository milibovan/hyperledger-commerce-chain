import { useCallback, useState } from "react";
import type { UserDetails, UsersData } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";

export function useUsers(channel: string = "channel-a") {
  const [data, setData] = useState<UsersData | null>(null);
  const [detailedData, setDetailedData] = useState<UserDetails>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/users/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        let parsedUsers = [];
        if (responseData.Users) {
          try {
            parsedUsers = JSON.parse(responseData.Users);
            if (!Array.isArray(parsedUsers)) {
              parsedUsers = [];
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse users, defaulting to empty array`,
              parseError
            );
            parsedUsers = [];
          }
        }

        const parsedData = {
          ...responseData,
          Users: parsedUsers,
        };
        setData(parsedData);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to fetch users");
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

  const fetchUserDetails = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${host}/users/details/${userId}/${channel}`, {
        method: httpMethod.GET,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
      const responseData = await response.json();
      
      const parsedData = {
        user: responseData.user,  
        orders: responseData.orders || [], 
        requests: responseData.requests || [],
      };

      setDetailedData(parsedData);
    } else {
      const errorData = await response.json();
      setError(errorData.Message || "Failed to fetch user details");
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

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch(`${host}/users/${channel}/${userId}`, {
          method: httpMethod.DELETE,
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          await fetchUsers();
          return { success: true };
        } else {
          const errorData = await response.json();
          const errorMsg = errorData.Message || "Failed to delete user";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = `Error deleting user: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [channel, fetchUsers]
  );

  return {
    users: data?.Users || [],
    userDetails: detailedData,
    loading,
    error,
    fetchUsers,
    deleteUser,
    fetchUserDetails
  };
}
