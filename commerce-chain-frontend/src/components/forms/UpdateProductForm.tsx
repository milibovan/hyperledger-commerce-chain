import { useState } from "react";
import { Send, AlertCircle, CheckCircle, Plus } from "lucide-react";
import type {
  UpdateProductFormsProps,
  Product,
} from "../../utils/utils";
import { channels, formatDate, TraderType } from "../../utils/utils";

export default function UpdateProductForm({
  onSuccess,
  product,
  handleActionClick,
  handleBackToList,
}: UpdateProductFormsProps) {
  const [formData, setFormData] = useState<Product>({
    id: product.id,
    name: product.name,
    expiryDate: formatDate(product["expiry-date"].toString()),
    traderType: product["trader-type"],
    price: product.price.toString(),
    quantity: product.quantity.toString(),
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
      !formData.expiryDate ||
      !formData.traderType ||
      !formData.price ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/products/${formData.channel}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.id,
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
        setSuccess(`Product updated: ${data.Message}`);
        setFormData({
          id: "",
          name: "",
          expiryDate: "",
          traderType: "",
          price: "",
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
        setError(errorData.Message || "Failed to update product");
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
        <div>
          <h3 className="text-3xl font-bold text-cyan-400 mb-2">
            Update Product
          </h3>
          <p className="text-sm text-gray-400">
            Editing product in{" "}
            <span className="text-cyan-300 font-semibold">
              {formData.channel}
            </span>
          </p>
        </div>

        {/* Current price display (not editable, but informative) */}
        <div className="px-4 py-3 bg-cyan-900/20 border border-cyan-500/30 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-cyan-300">Current quantity:</span>
              <p className="text-lg font-bold text-cyan-300">
                ${formData.quantity
                }
              </p>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Use the increate quantity feature to modify quantity
            </p>
            <button
              onClick={() => handleActionClick("increase_quantity", product)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded border-2 border-green-400 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Increase
            </button>
          </div>
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

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <AlertCircle size={20} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900 border-2 border-green-500 text-green-200 rounded">
            <CheckCircle size={20} />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          <Send size={20} />
          {loading ? "Updating..." : "Update Product"}
        </button>
      </div>
    </div>
  );
}
