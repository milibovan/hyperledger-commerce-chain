import { useState } from "react";
import { Send, AlertCircle, CheckCircle, Users } from "lucide-react";
import type { CreateFormsProps } from "../../utils/propsUtils";
import { channels, type User } from "../../utils/dataTypesUtils";
import { createUser } from "../../utils/utils";

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
      const response = await createUser(formData.channel, formData.name, formData.surname, formData.email, formData.balance)

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
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500 rounded-lg shadow-2xl shadow-purple-500/50">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-900/30">
              <Users size={32} className="text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-purple-400">Create User</h3>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-purple-300 font-semibold mb-2">
              Channel *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <select
                name="channel"
                value={formData.channel}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/30 hover:border-purple-500"
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

          {/* First Name */}
          <div>
            <label className="block text-purple-300 font-semibold mb-2">
              First Name *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/30 hover:border-purple-500"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-purple-300 font-semibold mb-2">
              Last Name *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/30 hover:border-purple-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-purple-300 font-semibold mb-2">
              Email *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/30 hover:border-purple-500"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-purple-300 font-semibold mb-2">
              Balance *
            </label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 focus-within:opacity-100 transition-opacity"></div>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="Enter balance"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 text-white rounded-lg font-semibold placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/30 hover:border-purple-500"
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
            className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-lg rounded-lg border-2 border-purple-400 transition-all duration-300 hover:shadow-xl hover:shadow-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:scale-105"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-300 to-purple-200"></div>
            <Send size={20} />
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}