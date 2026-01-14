import type { UserData, TraderData, Deposit } from "../../utils/dataTypesUtils";
import { channels } from "../../utils/dataTypesUtils";
import { useState, useMemo } from "react";
import { Send, AlertCircle, CheckCircle, DollarSign, Users, TrendingUp } from "lucide-react";
import type { DepositMoneyProps } from "../../utils/propsUtils";
import { host, httpMethod } from "../../utils/utils";

export default function DepositMoneyForm({
  user,
  onSuccess,
  handleBackToList,
}: DepositMoneyProps) {
  const [formData, setFormData] = useState<Deposit>({
    amount: "",
    channel: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Theme configuration based on user type
  const theme = useMemo(() => {
    const isTrader = user["doc-type"] === "trader";
    return {
      primary: isTrader ? "pink" : "purple",
      displayName: isTrader
        ? `${(user as TraderData).name}`
        : `${(user as UserData).name} ${(user as UserData).surname}`,
      entityType: isTrader ? "trader" : "user",
      icon: isTrader ? TrendingUp : Users,
      colors: {
        text: isTrader ? "text-pink-400" : "text-purple-400",
        textLight: isTrader ? "text-pink-300" : "text-purple-300",
        border: isTrader ? "border-pink-500" : "border-purple-500",
        accentGradient: isTrader ? "from-pink-400 to-pink-300" : "from-purple-400 to-purple-300",
        bgLight: isTrader ? "bg-pink-900/30" : "bg-purple-900/30",
        borderInput: isTrader ? "border-pink-400" : "border-purple-400",
        shadowHover: isTrader ? "shadow-pink-400/30" : "shadow-purple-400/30",
        buttonGradient: isTrader
          ? "from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600"
          : "from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600",
        buttonBorder: isTrader ? "border-pink-400" : "border-purple-400",
        buttonShadow: isTrader ? "shadow-pink-400/50" : "shadow-purple-400/50",
      }
    };
  }, [user]);

  const Icon = theme.icon;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!formData.amount || !formData.channel) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${host}/deposit-money/${formData.channel}`,
        {
          method: httpMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "user-id": user.id,
            amount: parseFloat(formData.amount),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Money deposited: ${data.Message}`);
        setFormData({
          amount: "",
          channel: "",
        });
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          handleBackToList();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to deposit money");
      }
    } catch (err) {
      setError(`Error connecting to server ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className={`relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${theme.colors.border} rounded-lg shadow-2xl shadow-${theme.primary}-500/50`}>
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.colors.accentGradient}`}></div>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${theme.colors.bgLight}`}>
              <Icon size={32} className={theme.colors.text} />
            </div>
            <div>
              <h3 className={`text-3xl font-bold ${theme.colors.text}`}>
                Deposit Money
              </h3>
              <p className={`text-lg ${theme.colors.textLight}`}>
                {theme.entityType.charAt(0).toUpperCase() + theme.entityType.slice(1)}: {theme.displayName}
              </p>
            </div>
          </div>

          {/* ID Display */}
          <div className="relative overflow-hidden bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.colors.accentGradient} opacity-50`}></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">ID:</span>
              <span className={`font-bold ${theme.colors.textLight}`}>{user.id}</span>
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label className={`block ${theme.colors.textLight} font-semibold mb-2`}>
              Channel *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.colors.accentGradient} opacity-0 focus-within:opacity-100 transition-opacity`}></div>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-${theme.colors.borderInput} focus:shadow-lg focus:${theme.colors.shadowHover} hover:border-${theme.primary}-500`}
              >
                <option value="" className="bg-gray-800 text-white">Select a channel</option>
                {channels.map((ch) => (
                  <option key={ch} value={ch} className="bg-gray-800 text-white">
                    {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={`block ${theme.colors.textLight} font-semibold mb-2`}>
              Amount *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.colors.accentGradient} opacity-0 focus-within:opacity-100 transition-opacity`}></div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-${theme.colors.borderInput} focus:shadow-lg focus:${theme.colors.shadowHover} hover:border-${theme.primary}-500`}
              />
            </div>

            {/* Balance Preview */}
            <div className="relative overflow-hidden mt-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.colors.accentGradient} opacity-50`}></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">Total Balance After Deposit:</span>
                </div>
                <span className={`text-lg font-bold ${theme.colors.text}`}>
                  ${(+user.balance + +formData.amount!).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="relative overflow-hidden px-4 py-3 bg-red-900/40 border-2 border-red-500 text-red-200 rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-pink-400"></div>
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="relative overflow-hidden px-4 py-3 bg-green-900/40 border-2 border-green-500 text-green-200 rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-green-300"></div>
              <div className="flex items-center gap-3">
                <CheckCircle size={20} />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r ${theme.colors.buttonGradient} text-white font-bold text-lg rounded-lg border-2 ${theme.colors.buttonBorder} transition-all duration-300 hover:shadow-xl hover:${theme.colors.buttonShadow} disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:scale-105`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.colors.accentGradient}`}></div>
            <Send size={20} />
            {loading ? "Depositing..." : "Deposit Money"}
          </button>
        </div>
      </div>
    </div>
  );
}