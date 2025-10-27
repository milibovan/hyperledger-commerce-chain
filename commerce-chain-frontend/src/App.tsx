import { useState } from "react";
import { LogOut } from "lucide-react";
import Menu from "./components/Menu";

type ConnectionState = "disconnected" | "connected";

export default function App() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [showOrgs, setShowOrgs] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizations = ["Org1", "Org2", "Org3"];
  const users = ["User1", "Admin"];

  const handleConnect = async () => {
    if (!selectedOrg || !selectedUser) {
      setError("Please select both organization and user");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: selectedOrg,
          userId: selectedUser,
        }),
      });

      if (response.ok) {
        setState("connected");
        setShowOrgs(false);
        setShowUsers(false);
      } else {
        setError("Connection failed");
      }
    } catch (err) {
      setError(`Error connecting to network ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setState("disconnected");
        setSelectedOrg(null);
        setSelectedUser(null);
      } else {
        setError("Disconnection failed");
      }
    } catch (err) {
      setError(`Error disconnecting from network ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = (org: string) => {
    setSelectedOrg(org);
    setShowUsers(true);
    setSelectedUser(null);
  };

  if (state === "connected") {
    return (
      <>
        <Menu />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
          <div className="absolute bottom-8 right-8">
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-900 text-white font-semibold rounded-3xl border-2 border-red-400 transition-all duration-200 disabled:opacity-50"
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>
          <div className="text-center text-cyan-400">
            <div className="text-4xl font-bold mb-4">Connected</div>
            <div className="text-lg text-purple-300">
              Organization: {selectedOrg}
            </div>
            <div className="text-lg text-purple-300">Role: {selectedUser}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2 text-center">
            NETWORK
          </h1>
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mb-8"></div>

          <div className="space-y-6">
            {/* Connect Button */}
            {!showOrgs && (
              <button
                onClick={() => setShowOrgs(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50"
              >
                Connect to Network
              </button>
            )}

            {/* Organizations */}
            {showOrgs && (
              <div className="space-y-3">
                <div className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">
                  Select Organization
                </div>
                {organizations.map((org) => (
                  <button
                    key={org}
                    onClick={() => handleOrgSelect(org)}
                    className={`w-full py-3 px-4 rounded border-2 font-semibold transition-all duration-200 ${
                      selectedOrg === org
                        ? "bg-cyan-500 border-cyan-300 text-gray-900 shadow-lg shadow-cyan-400/50"
                        : "bg-gray-700 border-gray-600 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200"
                    }`}
                  >
                    {org}
                  </button>
                ))}
              </div>
            )}

            {/* Users */}
            {showUsers && selectedOrg && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="text-purple-400 text-sm font-semibold uppercase tracking-wider">
                  Select Role
                </div>
                {users.map((user) => (
                  <button
                    key={user}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full py-3 px-4 rounded border-2 font-semibold transition-all duration-200 ${
                      selectedUser === user
                        ? "bg-purple-500 border-purple-300 text-gray-900 shadow-lg shadow-purple-400/50"
                        : "bg-gray-700 border-gray-600 text-purple-300 hover:border-purple-400 hover:text-purple-200"
                    }`}
                  >
                    {user}
                  </button>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-900 border-2 border-red-500 text-red-200 rounded text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            {showUsers && selectedOrg && selectedUser && (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
              >
                {loading ? "Connecting..." : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className="text-cyan-500 text-sm font-mono">
            STATUS: <span className="text-purple-400">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
