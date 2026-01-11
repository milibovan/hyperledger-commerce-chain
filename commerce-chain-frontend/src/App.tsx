import { useState } from "react";
import { LogOut, Link2, Building2, User, AlertCircle } from "lucide-react";
import Menu from "./components/Menu";
import { host } from "./utils/utils";

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
      const response = await fetch(`${host}/connect`, {
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
      const response = await fetch(`${host}/disconnect`, {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Menu />

        {/* Connection Info - Top Right - Hoverable */}
        <div className="fixed top-4 right-4 z-50 group">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500 rounded-lg shadow-xl shadow-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/70 w-12 h-12 hover:w-auto hover:h-auto">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500"></div>

            {/* Collapsed state - just dot */}
            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-500">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* Expanded state */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 px-4 py-3 flex items-center gap-3 whitespace-nowrap">
              <div className="p-2 rounded-lg bg-cyan-900/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">
                  Connected
                </div>
                <div className="text-sm text-purple-300 font-medium">
                  {selectedOrg} • {selectedUser}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disconnect Button - Bottom Right - Hoverable */}
        <div className="fixed bottom-4 right-4 z-50 group">
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg border-2 border-red-400 transition-all duration-500 disabled:opacity-50 hover:shadow-xl hover:shadow-red-500/50 w-12 h-12 hover:w-auto hover:px-5 hover:py-3"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-pink-400"></div>
            <LogOut size={18} className="flex-shrink-0" />
            <span className="hidden group-hover:inline whitespace-nowrap">Disconnect</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500 rounded-lg shadow-2xl shadow-cyan-500/50">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>

          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-cyan-900/30">
                <Link2 size={32} className="text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-cyan-400">
                NETWORK
              </h1>
            </div>

            <div className="space-y-6">
              {/* Connect Button */}
              {!showOrgs && (
                <button
                  onClick={() => setShowOrgs(true)}
                  className="relative overflow-hidden w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-lg border-2 border-cyan-400 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-400/50 hover:scale-105"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white/50 to-transparent"></div>
                  Connect to Network
                </button>
              )}

              {/* Organizations */}
              {showOrgs && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    <Building2 size={16} />
                    Select Organization
                  </div>
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div
                        key={org}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all duration-500 cursor-pointer hover:scale-[1.02] ${selectedOrg === org
                          ? "bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 shadow-lg shadow-cyan-400/50"
                          : "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-cyan-500"
                          }`}
                        onClick={() => handleOrgSelect(org)}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${selectedOrg === org ? "from-cyan-300 to-blue-300" : "from-gray-500 to-gray-600"
                          }`}></div>
                        <div className="py-3 px-4 flex items-center gap-3">
                          <div className={`p-1.5 rounded ${selectedOrg === org ? "bg-cyan-800/50" : "bg-gray-600/50"
                            }`}>
                            <Building2 size={16} className={selectedOrg === org ? "text-cyan-200" : "text-gray-400"} />
                          </div>
                          <span className={`font-semibold ${selectedOrg === org ? "text-white" : "text-cyan-300"
                            }`}>
                            {org}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {showUsers && selectedOrg && (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    <User size={16} />
                    Select Role
                  </div>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all duration-500 cursor-pointer hover:scale-[1.02] ${selectedUser === user
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400 shadow-lg shadow-purple-400/50"
                          : "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-purple-500"
                          }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${selectedUser === user ? "from-purple-300 to-pink-300" : "from-gray-500 to-gray-600"
                          }`}></div>
                        <div className="py-3 px-4 flex items-center gap-3">
                          <div className={`p-1.5 rounded ${selectedUser === user ? "bg-purple-800/50" : "bg-gray-600/50"
                            }`}>
                            <User size={16} className={selectedUser === user ? "text-purple-200" : "text-gray-400"} />
                          </div>
                          <span className={`font-semibold ${selectedUser === user ? "text-white" : "text-purple-300"
                            }`}>
                            {user}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="relative overflow-hidden px-4 py-3 bg-red-900/40 border-2 border-red-500 text-red-200 rounded-lg">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-pink-400"></div>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {showUsers && selectedOrg && selectedUser && (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="relative overflow-hidden w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-lg border-2 border-purple-400 transition-all duration-500 hover:shadow-xl hover:shadow-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:scale-105"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white/50 to-transparent"></div>
                  {loading ? "Connecting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">
              Status: <span className="text-purple-400">Ready</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}