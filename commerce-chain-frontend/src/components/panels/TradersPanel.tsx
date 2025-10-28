import { useState } from "react";
import CreateTraderForm from "../forms/CreateTraderForm";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";

export default function TradersPanel() {
  const [action, setAction] = useState<
    "list" | "create" | "read" | "update" | "delete" | null
  >(null);

  const crudActions = [
    { label: "Create", icon: <Plus size={20} />, value: "create" as const },
    { label: "Read", icon: <Eye size={20} />, value: "read" as const },
    { label: "Update", icon: <Edit size={20} />, value: "update" as const },
    { label: "Delete", icon: <Trash2 size={20} />, value: "delete" as const },
  ];

  const renderContent = () => {
    switch (action) {
      case "create":
        return <CreateTraderForm />;
      //   case 'read':
      //     return <ReadUserForm />;
      //   case 'update':
      //     return <UpdateUserForm />;
      //   case 'delete':
      //     return <DeleteUserForm />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!action ? (
        <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
          <h3 className="text-3xl font-bold text-pink-400 mb-6">Traders</h3>
          <div className="grid grid-cols-2 gap-4">
            {crudActions.map((item) => (
              <button
                key={item.value}
                onClick={() => setAction(item.value)}
                className="flex items-center gap-3 px-6 py-4 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
          <button
            onClick={() => setAction(null)}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-pink-300 font-semibold rounded border-2 border-gray-600 transition-all"
          >
            ← Back
          </button>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
