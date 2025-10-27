import { useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  Receipt,
  Plus,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import CreateTraderForm from "./forms/CreateTraderForm";
import CreateProductForm from "./forms/CreateProductForm";
import UsersPanel from "./panels/UserPanel";
import ReceiptsPanel from "./panels/ReceiptsPanel";

type MenuItem = "Products" | "Users" | "Traders" | "Receipts";

export default function Menu() {
  const [activeItem, setActiveItem] = useState<MenuItem>("Products");

  const menuItems: { label: MenuItem; icon: React.ReactNode }[] = [
    { label: "Products", icon: <Package size={24} /> },
    { label: "Users", icon: <Users size={24} /> },
    { label: "Traders", icon: <TrendingUp size={24} /> },
    { label: "Receipts", icon: <Receipt size={24} /> },
  ];

  const renderContent = () => {
    switch (activeItem) {
      case "Products":
        return <ProductsPanel />;
      case "Users":
        return <UsersPanel />;
      case "Traders":
        return <TradersPanel />;
      case "Receipts":
        return <ReceiptsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 border-r-2 border-cyan-500 p-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-8 uppercase tracking-wider">
          Menu
        </h2>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setActiveItem(item.label)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded border-2 font-semibold transition-all duration-200 ${
                  activeItem === item.label
                    ? "bg-cyan-500 border-cyan-300 text-gray-900 shadow-lg shadow-cyan-400/50"
                    : "bg-gray-700 border-gray-600 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col">{renderContent()}</div>
    </div>
  );
}

function ProductsPanel() {
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
        return <CreateProductForm />;
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
        <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
          <h3 className="text-3xl font-bold text-cyan-400 mb-6">Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {crudActions.map((item) => (
              <button
                key={item.value}
                onClick={() => setAction(item.value)}
                className="flex items-center gap-3 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded border-2 border-cyan-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
          <button
            onClick={() => setAction(null)}
            className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold rounded border-2 border-gray-600 transition-all"
          >
            ← Back
          </button>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

function TradersPanel() {
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

