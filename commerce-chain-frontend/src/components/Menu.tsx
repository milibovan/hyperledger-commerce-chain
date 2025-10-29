import { useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  MenuIcon,
} from "lucide-react";
import UsersPanel from "./panels/UsersPanel";
import ReceiptsPanel from "./panels/ReceiptsPanel";
import TradersPanel from "./panels/TradersPanel";
import ProductsPanel from "./panels/ProductsPanel";

type MenuItem = "Products" | "Users" | "Traders" | "Receipts";

export default function Menu() {
  const [activeItem, setActiveItem] = useState<MenuItem>("Products");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { label: MenuItem; icon: React.ReactNode }[] = [
    { label: "Products", icon: <Package size={24} /> },
    { label: "Users", icon: <Users size={24} /> },
    { label: "Traders", icon: <TrendingUp size={24} /> },
    { label: "Receipts", icon: <Receipt size={24} /> },
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    setActiveItem(item);
    setIsMenuOpen(false);
  };

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
      <nav
        className={`fixed left-0 top-0 h-full bg-gray-800 border-r-2 border-cyan-500 z-40 transition-all duration-300 ${
          isMenuOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="mb-4 overflow-hidden">
            {isMenuOpen ? (
              <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider whitespace-nowrap">
                Menu
              </h2>
            ) : (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <MenuIcon size={39} className="ml-1"/>
              </button>
            )}
          </div>

          {/* Menu Items */}
          <ul className="space-y-3 flex-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleMenuItemClick(item.label)}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded border-2 font-semibold transition-all duration-200 ${
                    activeItem === item.label
                      ? "bg-cyan-500 border-cyan-300 text-gray-900 shadow-lg shadow-cyan-400/50"
                      : "bg-gray-700 border-gray-600 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200"
                  } ${!isMenuOpen ? "justify-center" : ""}`}
                  title={!isMenuOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isMenuOpen && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-cyan-400 rounded border-2 border-gray-600 hover:border-cyan-400 transition-all flex items-center justify-center"
          >
            {isMenuOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div
        className={`flex-1 p-8 flex flex-col transition-all duration-300 mr-8 ${
          isMenuOpen ? "ml-64" : "ml-20"
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
}
