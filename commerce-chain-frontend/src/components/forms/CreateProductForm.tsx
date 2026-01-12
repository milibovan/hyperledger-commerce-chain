import { useState } from "react";
import type { Product } from "../../utils/dataTypesUtils";
import { channels, TraderType } from "../../utils/dataTypesUtils";
import { Send, AlertCircle, CheckCircle, Package } from "lucide-react";
import { createProduct } from "../../utils/utils";
import type { CreateFormsProps } from "../../utils/propsUtils";

export default function CreateProductForm({ onSuccess }: CreateFormsProps) {
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    expiryDate: "",
    price: "",
    quantity: "",
    traderType: "",
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
      !formData.name ||
      !formData.quantity ||
      !formData.price ||
      !formData.expiryDate ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await createProduct(formData.channel, formData.traderType, formData.expiryDate, formData.quantity, formData.price, formData.name)

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Product created: ${data.Message}`);
        setFormData({
          id: "",
          name: "",
          expiryDate: "",
          price: "",
          quantity: "",
          traderType: "",
          channel: "",
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to create product");
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
              <Package size={32} className="text-cyan-400" />
            </div>
            <h3 className="text-3xl font-bold text-cyan-400">Create Product</h3>
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

          {/* Trader Type */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Trader Type *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <select
                name="traderType"
                value={formData.traderType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
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

          {/* Name */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Name *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Price *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Quantity *
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
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-cyan-300 font-semibold mb-2">
              Expiry Date *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="datetime-local"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/30 hover:border-cyan-500"
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
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}