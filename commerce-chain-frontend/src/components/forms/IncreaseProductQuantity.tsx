import { useState } from "react";
import type { IncreaseQuantityProps } from "../../utils/propsUtils";
import { channels, type Deposit } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";
import { AlertCircle, CheckCircle, Send, Package, Plus } from "lucide-react";

export default function IncreaseProductQuantity({
  product,
  onSuccess,
  handleBackToList,
}: IncreaseQuantityProps) {
  const [formData, setFormData] = useState<Deposit>({
    quantity: "",
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

    if (!formData.quantity || !formData.channel) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${host}/increase-quantity/${formData.channel}`,
        {
          method: httpMethod.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "product-id": product.id,
            quantity: parseFloat(formData.quantity),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Quantity increased: ${data.Message}`);
        setFormData({
          quantity: "",
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
        setError(errorData.Message || "Failed to increase quantity");
      }
    } catch (err) {
      setError(`Error connecting to server ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500 rounded-lg shadow-2xl shadow-cyan-500/50">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-400"></div>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-cyan-900/30">
              <Plus size={32} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-cyan-400">
                Increase Quantity
              </h3>
              <p className="text-lg text-cyan-300">
                Product: {product.name}
              </p>
            </div>
          </div>

          {/* ID Display */}
          <div className="relative overflow-hidden bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-50"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Product ID:</span>
              <span className="font-bold text-cyan-300">{product.id}</span>
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Channel *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
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

          {/* Quantity */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Quantity to Add *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                step="1"
                min="1"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
              />
            </div>

            {/* Quantity Preview */}
            <div className="relative overflow-hidden mt-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-50"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-400">New Total Quantity:</span>
                </div>
                <span className="text-lg font-bold text-cyan-400">
                  {+product.quantity + +formData.quantity!}
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
            <div className="relative overflow-hidden px-4 py-3 bg-cyan-900/40 border-2 border-cyan-500 text-cyan-200 rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300"></div>
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
            className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold text-lg rounded-lg border-2 border-cyan-400 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:scale-105"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-300 to-cyan-200"></div>
            <Send size={20} />
            {loading ? "Processing..." : "Increase Quantity"}
          </button>
        </div>
      </div>
    </div>
  );
}