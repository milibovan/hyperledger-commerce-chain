import { useState } from "react";
import { Send, AlertCircle, CheckCircle, Plus, DollarSign, Edit } from "lucide-react";
import { type User, channels } from "../../utils/dataTypesUtils";
import { host } from "../../utils/utils";
import type { UpdateUserFormsProps } from "../../utils/propsUtils";

export default function UpdateUserForm({
  onSuccess,
  user,
  handleActionClick,
  handleBackToList
}: UpdateUserFormsProps) {
  const [formData, setFormData] = useState<User>({
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    balance: user.balance.toString(),
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
        `${host}/users/${formData.channel}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.id,
            name: formData.name,
            surname: formData.surname,
            email: formData.email,
            balance: parseFloat(formData.balance),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(`User updated: ${data.Message}`);
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
        setTimeout(() => {
          handleBackToList();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.Message || "Failed to update user");
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
              <Edit size={32} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-purple-400">
                Update User
              </h3>
              <p className="text-sm text-gray-400">
                Editing user in{" "}
                <span className="text-purple-300 font-semibold">
                  {formData.channel}
                </span>
              </p>
            </div>
          </div>

          {/* Current Balance Display with Deposit Button */}
          <div className="relative overflow-hidden bg-purple-900/20 border-2 border-purple-500/50 rounded-lg p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-300 opacity-50"></div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-purple-400" />
                <div>
                  <span className="text-sm text-purple-300">Current Balance:</span>
                  <p className="text-lg font-bold text-purple-300">
                    ${formData.balance}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  Use the deposit feature to modify balance
                </p>
                <button
                  onClick={() => handleActionClick("deposit", user)}
                  className="relative overflow-hidden px-4 py-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg border-2 border-green-400 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-green-400/30"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-300 to-green-200"></div>
                  <Plus size={18} />
                  Deposit
                </button>
              </div>
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
            {loading ? "Updating..." : "Update User"}
          </button>
        </div>
      </div>
    </div>
  );
}