import { useState } from "react";
import type { Product } from "../../utils/utils";
import { channels, TraderType } from "../../utils/utils";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

export default function CreateProductForm() {
  const [formData, setFormData] = useState<Product>({
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
      const response = await fetch(
        `http://localhost:8080/product/${formData.channel}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "trader-type": formData.traderType,
            "expiry-date": formData.expiryDate.replace("T", " "),
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
            name: formData.name,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Product created: ${data.Message}`);
        setFormData({
          name: "",
          expiryDate: "",
          price: "",
          quantity: "",
          traderType: "",
          channel: "",
        });
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
      <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50 space-y-6">
        <h3 className="text-3xl font-bold text-cyan-400 mb-6">Create User</h3>

        {/* Channel Selection */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Channel *
          </label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          >
            <option value="">Select a channel</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Trader Type */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Trader Type *
          </label>
          <select
            name="traderType"
            value={formData.traderType}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          >
            <option value="">Select a trader type</option>
            {TraderType.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Price *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter price"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            step="1"
            min="1"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-cyan-300 font-semibold mb-2">
            Expiry Date *
          </label>
          <input
            type="datetime-local"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="Enter Expiry Date"
            step="1"
            min="1"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-lg focus:shadow-cyan-400/50"
          />
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
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          <Send size={20} />
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
}
