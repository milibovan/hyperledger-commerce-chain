import { useState } from "react";
import { Send, AlertCircle, CheckCircle, Plus, DollarSign, Edit } from "lucide-react";
import type { Trader, TraderData } from "../../utils/dataTypesUtils";
import { channels, TraderType } from "../../utils/dataTypesUtils";
import type { UpdateTraderFormsProps } from "../../utils/propsUtils";
import { host } from "../../utils/utils";

export default function UpdateTraderForm({
  onSuccess,
  trader,
  handleActionClick,
  handleBackToList,
}: UpdateTraderFormsProps) {
  const [formData, setFormData] = useState<Trader>({
    id: trader.id,
    name: trader.name,
    vat: trader.vat,
    email: trader.email,
    traderType: trader["trader-type"],
    balance: trader.balance.toString(),
    channel: channels[0],
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
      !formData.name ||
      !formData.vat ||
      !formData.email ||
      !formData.traderType ||
      !formData.balance ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${host}/traders/${formData.channel}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.id,
            name: formData.name,
            vat: formData.vat,
            email: formData.email,
            "trader-type": formData.traderType,
            balance: parseFloat(formData.balance),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Trader updated: ${data.Message}`);
        setFormData({
          id: "",
          name: "",
          vat: "",
          email: "",
          traderType: "",
          balance: "",
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
        setError(errorData.Message || "Failed to update trader");
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
              <Edit size={32} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-pink-400">
                Update Trader
              </h3>
              <p className="text-sm text-gray-400">
                Editing trader in{" "}
                <span className="text-pink-300 font-semibold">
                  {formData.channel}
                </span>
              </p>
            </div>
          </div>

          {/* Current Balance Display with Deposit Button */}
          <div className="relative overflow-hidden bg-pink-900/20 border-2 border-pink-500/50 rounded-lg p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 to-pink-300 opacity-50"></div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-pink-400" />
                <div>
                  <span className="text-sm text-pink-300">Current Balance:</span>
                  <p className="text-lg font-bold text-pink-300">
                    ${formData.balance}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  Use the deposit feature to modify balance
                </p>
                <button
                  onClick={() => handleActionClick("deposit", trader as TraderData)}
                  className="relative overflow-hidden px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg border-2 border-green-400 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-green-400/30"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-300 to-green-200"></div>
                  <Plus size={18} />
                  Deposit
                </button>
              </div>
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
            {loading ? "Updating..." : "Update Trader"}
          </button>
        </div>
      </div>
    </div>
  );
}