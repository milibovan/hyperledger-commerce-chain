import { useState } from "react";
import { Send, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import type { Trader } from "../../utils/dataTypesUtils";
import { TraderType, channels } from "../../utils/dataTypesUtils";
import type { CreateFormsProps } from "../../utils/propsUtils";
import { createTrader } from "../../utils/utils";

export default function CreateTraderForm({ onSuccess }: CreateFormsProps) {
  const [formData, setFormData] = useState<Trader>({
    id: "",
    name: "",
    traderType: "",
    vat: "",
    email: "",
    balance: "",
    channel: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    if (
      !formData.traderType ||
      !formData.vat ||
      !formData.balance ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await createTrader(formData.channel, formData.name, formData.traderType, formData.vat, formData.email, formData.balance)

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Trader created: ${data.Message}`);
        setFormData({
          id: "",
          name: "",
          traderType: "",
          vat: "",
          balance: "",
          email: "",
          channel: "",
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to create user");
      }
    } catch (err) {
      setError(`Error connecting to server ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-500 rounded-lg shadow-2xl shadow-pink-500/50">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-400"></div>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-pink-900/30">
              <TrendingUp size={32} className="text-pink-400" />
            </div>
            <h3 className="text-3xl font-bold text-pink-400">Create Trader</h3>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              Channel *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
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

          {/* Trader Name */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              Trader Name *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter trader name"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
              />
            </div>
          </div>

          {/* Trader Email */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              Trader Email *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter trader email"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
              />
            </div>
          </div>

          {/* Trader Type */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              Trader Type *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <select
                name="traderType"
                value={formData.traderType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
              >
                <option value="" className="bg-gray-800 text-white">Select a trader type</option>
                {TraderType.map((type) => (
                  <option key={type} value={type} className="bg-gray-800 text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VAT */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              VAT *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="vat"
                value={formData.vat}
                onChange={handleChange}
                placeholder="Enter vat"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-pink-300 font-semibold mb-2">
              Balance *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="Enter balance"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-400/30 hover:border-pink-500"
              />
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
            className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white font-bold text-lg rounded-lg border-2 border-pink-400 transition-all duration-300 hover:shadow-xl hover:shadow-pink-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:scale-105"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-300 to-pink-200"></div>
            <Send size={20} />
            {loading ? "Creating..." : "Create Trader"}
          </button>
        </div>
      </div>
    </div>
  );
}