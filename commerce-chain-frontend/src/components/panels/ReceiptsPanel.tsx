import { useState } from "react";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";

export default function ReceiptsPanel() {
  const [action, setAction] = useState<
    "list" | "create" | "read" | "update" | "delete" | null
  >(null);

  const crudActions = [
    { label: "Create", icon: <Plus size={20} />, value: "create" as const },
    { label: "Read", icon: <Eye size={20} />, value: "read" as const },
    { label: "Update", icon: <Edit size={20} />, value: "update" as const },
    { label: "Delete", icon: <Trash2 size={20} />, value: "delete" as const },
  ];

  return (
    <div className="space-y-6">
      {!action ? (
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
          <h3 className="text-3xl font-bold text-green-400 mb-6">Receipts</h3>
          <div className="grid grid-cols-2 gap-4">
            {crudActions.map((item) => (
              <button
                key={item.value}
                onClick={() => setAction(item.value)}
                className="flex items-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
          <button
            onClick={() => setAction(null)}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-300 font-semibold rounded border-2 border-gray-600 transition-all"
          >
            ← Back
          </button>
          <h3 className="text-3xl font-bold text-green-400 mb-4 capitalize">
            {action} Receipt
          </h3>
          <p className="text-gray-300">{action} functionality goes here</p>
        </div>
      )}
    </div>
  );
}