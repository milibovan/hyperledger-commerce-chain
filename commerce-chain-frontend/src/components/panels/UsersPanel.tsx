import { useState, useEffect } from "react";
import type { UsersData, UserData } from "../../utils/utils";
import { Plus, Edit, Trash2 } from "lucide-react";
import CreateUserForm from "../forms/CreateUserForm";

export default function UsersPanel() {
  const [data, setData] = useState<UsersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<
    "create" | "deposit" | "update" | "delete" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewDetails, setViewDetails] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/users/channel-a`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const responseData = await response.json();
        const parsedData = {
          ...responseData,
          Users: JSON.parse(responseData.Users),
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleActionClick = (actionType: typeof action, user: UserData) => {
    setSelectedUser(user);
    setAction(actionType);
  };

  const handleBackToList = () => {
    setAction(null);
    setSelectedUser(null);
    setViewDetails(false);
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateUserForm onSuccess={fetchUsers} />;
    }
    if (viewDetails && selectedUser) {
      return (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-purple-400">User Details</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <span className="font-semibold text-purple-300">ID:</span>{" "}
              {selectedUser.id}
            </div>
            <div>
              <span className="font-semibold text-purple-300">Email:</span>{" "}
              {selectedUser.email}
            </div>
            <div>
              <span className="font-semibold text-purple-300">Name:</span>{" "}
              {selectedUser.name} {selectedUser.surname}
            </div>
            <div>
              <span className="font-semibold text-purple-300">Balance:</span> $
              {selectedUser.balance.toFixed(2)}
            </div>
          </div>
        </div>
      );
    }
    switch (action) {
      case "deposit":
        return (
          <div className="text-gray-300">
            Deposit form for {selectedUser?.name} {selectedUser?.surname}
          </div>
        );
      case "update":
        return (
          <div className="text-gray-300">
            Update form for {selectedUser?.name} {selectedUser?.surname}
          </div>
        );
      case "delete":
        return (
          <div className="text-gray-300">
            Delete confirmation for {selectedUser?.name} {selectedUser?.surname}
          </div>
        );
      default:
        return null;
    }
  };

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
        <div className="flex justify-between items-center mb-6">
          <div
            className="flex gap-2 my-4 justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleBackToList}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-purple-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Users
            </button>
          </div>
          <div className="flex gap-2 my-4 justify-end">
            <button
              // onClick={() => handleActionClick("deposit", user)}
              className="flex items-center mb-4 px-4 py-2 gap-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all text-white font-semibold"
              title="Deposit"
            >
              <Plus size={18} /> Deposit
            </button>
            <button
              // onClick={() => handleActionClick("update", user)}
              className="flex items-center justify-center mb-4 px-4 py-2 gap-3 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all  text-white font-semibold"
              title="Update"
            >
              <Edit size={18} /> Update
            </button>
            <button
              // onClick={() => handleActionClick("delete", user)}
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
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-purple-400">Users</h3>
          <button
            onClick={() => setAction("create")}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50"
          >
            <Plus size={20} />
            Create User
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-purple-300 py-8">
            Loading users...
          </div>
        ) : data && Array.isArray(data.Users) && data.Users.length > 0 ? (
          <div className="space-y-3">
            {data.Users.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setViewDetails(true);
                }}
                className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 cursor-pointer"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-purple-300">
                    {user.name} {user.surname}
                  </h4>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className="font-bold text-purple-300">
                      ${user.balance.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleActionClick("deposit", user)}
                      className="p-2 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all"
                      title="Deposit"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => handleActionClick("update", user)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded border-2 border-blue-400 transition-all"
                      title="Update"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleActionClick("delete", user)}
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
          <div className="text-center text-gray-400 py-8">No users found</div>
        )}
      </div>
    </div>
  );
}
