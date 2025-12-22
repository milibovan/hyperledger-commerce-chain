import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import type { CreateFormsProps } from "../../utils/propsUtils";
import { channels, type User } from "../../utils/dataTypesUtils";
import { host } from "../../utils/utils";

export default function CreateUserForm({ onSuccess }: CreateFormsProps) {
  const [formData, setFormData] = useState<User>({
    id: "",
    name: "",
    surname: "",
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
      !formData.name ||
      !formData.surname ||
      !formData.email ||
      !formData.balance ||
      !formData.channel
    ) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${host}/user/${formData.channel}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            surname: formData.surname,
            email: formData.email,
            balance: parseFloat(formData.balance),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`User created: ${data.Message}`);
        setFormData({
          id: "",
          name: "",
          surname: "",
          email: "",
          balance: "",
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
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50 space-y-6">
        <h3 className="text-3xl font-bold text-purple-400 mb-6">Create User</h3>

        {/* Channel Selection */}
        <div>
          <label className="block text-purple-300 font-semibold mb-2">
            Channel *
          </label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 border-2 border-purple-500 text-white rounded font-semibold transition-all duration-200 focus:outline-none focus:border-purple-300 focus:shadow-lg focus:shadow-purple-400/50"
          >
            <option value="">Select a channel</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* First Name */}
        <div>
          <label className="block text-purple-300 font-semibold mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter first name"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-purple-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-purple-300 focus:shadow-lg focus:shadow-purple-400/50"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-purple-300 font-semibold mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            placeholder="Enter last name"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-purple-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-purple-300 focus:shadow-lg focus:shadow-purple-400/50"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-purple-300 font-semibold mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-purple-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-purple-300 focus:shadow-lg focus:shadow-purple-400/50"
          />
        </div>

        {/* Balance */}
        <div>
          <label className="block text-purple-300 font-semibold mb-2">
            Balance *
          </label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            placeholder="Enter balance"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 bg-gray-700 border-2 border-purple-500 text-white rounded font-semibold placeholder-gray-500 transition-all duration-200 focus:outline-none focus:border-purple-300 focus:shadow-lg focus:shadow-purple-400/50"
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
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-gray-900 font-bold text-lg rounded border-2 border-purple-300 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
        >
          <Send size={20} />
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
}
