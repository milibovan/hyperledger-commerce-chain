import { useState } from "react";
import type { IncreaseQuantityProps } from "../../utils/propsUtils";
import { channels, type Deposit } from "../../utils/dataTypesUtils";
import { host, httpMethod } from "../../utils/utils";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

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
      <div
        className={`bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50 space-y-6`}
      >
        <h3 className={`text-3xl font-bold text-cyan-400 mb-6`}>
          Increase quantity for product{" "}
          <strong className="text-cyan-300">{product.name}</strong>
        </h3>
        <h3 className={`text-xl font-bold text-cyan-400 mb-6`}>
          ID: <strong className="text-cyan-300">{product.id}</strong>
        </h3>

        {/* Channel Selection */}
        <div>
          <label className={`block text-cyan-300 font-semibold mb-2`}>
            Channel *
          </label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-cyan-400/50`}
          >
            <option value="">Select a channel</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className={`block text-cyan-300 font-semibold mb-2`}>
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
            className={`w-full px-4 py-3 bg-gray-700 border-2 border-cyan-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-cyan-300 focus:shadow-cyan-400/50`}
          />
          <p className={`text-sm text-cyan-300 mt-3`}>
            Total quantity: {+product.quantity + +formData.quantity!}
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
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-cyan-300 transition-all duration-200 hover:shadow-lg shadow-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide`}
        >
          <Send size={20} />
          {loading ? "Depositing..." : "Deposit money"}
        </button>
      </div>
    </div>
  );
}
