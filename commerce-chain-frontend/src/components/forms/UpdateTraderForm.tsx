import { useState } from "react";
import { Send, AlertCircle, CheckCircle, Plus } from "lucide-react";
import type {
  Trader,
  TraderData,
} from "../../utils/dataTypesUtils";
import { channels, TraderType } from "../../utils/dataTypesUtils";
import type { UpdateTraderFormsProps } from "../../utils/propsUtils";

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
      !formData.traderType ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/traders/${formData.channel}`,
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
      <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50 space-y-6">
        <div>
          <h3 className="text-3xl font-bold text-pink-400 mb-2">
            Update Trader
          </h3>
          <p className="text-sm text-gray-400">
            Editing trader in{" "}
            <span className="text-pink-300 font-semibold">
              {formData.channel}
            </span>
          </p>
        </div>

        {/* Current balance display (not editable, but informative) */}
        <div className="px-4 py-3 bg-pink-900/20 border border-pink-500/30 rounded">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-pink-300">Current Balance:</span>
              <p className="text-lg font-bold text-pink-300">
                ${formData.balance}
              </p>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Use the deposit feature to modify balance
            </p>
            <button
              onClick={() => handleActionClick("deposit", trader as TraderData)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded border-2 border-green-400 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Deposit
            </button>
          </div>
        </div>

        {/* Trader Name */}
        <div>
          <label className="block text-pink-300 font-semibold mb-2">
            Trader Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter trader name"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-pink-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-pink-300 focus:shadow-lg focus:shadow-pink-400/50"
          />
        </div>

        {/* Trader Email */}
        <div>
          <label className="block text-pink-300 font-semibold mb-2">
            Trader Email *
          </label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter trader email"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-pink-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-pink-300 focus:shadow-lg focus:shadow-pink-400/50"
          />
        </div>

        {/* Trader Type */}
        <div>
          <label className="block text-pink-300 font-semibold mb-2">
            Trader Type *
          </label>
          <select
            name="traderType"
            value={formData.traderType}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 border-2 border-pink-500 text-white rounded font-semibold transition-all duration-200 focus:outline-none focus:border-pink-300 focus:shadow-lg focus:shadow-pink-400/50"
          >
            <option value="">Select a trader type</option>
            {TraderType.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* VAT */}
        <div>
          <label className="block text-pink-300 font-semibold mb-2">
            VAT *
          </label>
          <input
            type="text"
            name="vat"
            value={formData.vat}
            onChange={handleChange}
            placeholder="Enter vat"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-pink-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-pink-300 focus:shadow-lg focus:shadow-pink-400/50"
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
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-pink-300 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          <Send size={20} />
          {loading ? "Updating..." : "Update Trader"}
        </button>
      </div>
    </div>
  );
}
