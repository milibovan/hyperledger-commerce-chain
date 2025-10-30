import type { UserData, TraderData, Deposit } from "../../utils/utils";
import { channels } from "../../utils/utils";
import { useState, useMemo } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

interface DepositMoneyProps {
  user: UserData | TraderData;
  onSuccess?: () => void;
  handleBackToList: () => void;
}

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
      colors: {
        text: isTrader ? "text-pink-400" : "text-purple-400",
        textLight: isTrader ? "text-pink-300" : "text-purple-300",
        border: isTrader ? "border-pink-500" : "border-purple-500",
        borderLight: isTrader ? "border-pink-300" : "border-purple-300",
        shadow: isTrader ? "shadow-pink-500/50" : "shadow-purple-500/50",
        shadowHover: isTrader ? "shadow-pink-400/50" : "shadow-purple-400/50",
        focus: isTrader ? "focus:border-pink-300 focus:shadow-pink-400/50" : "focus:border-purple-300 focus:shadow-purple-400/50",
        gradient: isTrader 
          ? "from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400" 
          : "from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400",
      }
    };
  }, [user]);

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
        `http://localhost:8080/deposit-money/${formData.channel}`,
        {
          method: "POST",
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
      <div className={`bg-gray-800 border-2 ${theme.colors.border} rounded-lg p-8 shadow-2xl ${theme.colors.shadow} space-y-6`}>
        <h3 className={`text-3xl font-bold ${theme.colors.text} mb-6`}>
          Deposit money for {theme.entityType}{" "}
          <strong className={theme.colors.textLight}>
            {theme.displayName}
          </strong>
        </h3>
        <h3 className={`text-xl font-bold ${theme.colors.text} mb-6`}>
          ID: <strong className={theme.colors.textLight}>{user.id}</strong>
        </h3>

        {/* Channel Selection */}
        <div>
          <label className={`block ${theme.colors.textLight} font-semibold mb-2`}>
            Channel *
          </label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-gray-700 border-2 ${theme.colors.border} text-white rounded font-semibold transition-all duration-200 focus:outline-none ${theme.colors.focus}`}
          >
            <option value="">Select a channel</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className={`block ${theme.colors.textLight} font-semibold mb-2`}>
            Amount *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            step="0.01"
            min="0"
            className={`w-full px-4 py-3 bg-gray-700 border-2 ${theme.colors.border} text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none ${theme.colors.focus}`}
          />
          <p className={`text-sm ${theme.colors.textLight} mt-3`}>
            Total balance: ${(+user.balance + +formData.amount).toFixed(2)}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <AlertCircle size={20} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900 border-2 border-green-500 text-green-200 rounded">
            <CheckCircle size={20} />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r ${theme.colors.gradient} text-gray-900 font-bold text-lg rounded border-2 ${theme.colors.borderLight} transition-all duration-200 hover:shadow-lg ${theme.colors.shadowHover} disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide`}
        >
          <Send size={20} />
          {loading ? "Depositing..." : "Deposit money"}
        </button>
      </div>
    </div>
  );
}