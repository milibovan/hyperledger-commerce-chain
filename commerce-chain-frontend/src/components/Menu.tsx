import { useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  AlignJustify,
} from "lucide-react";
import UsersPanel from "./panels/UsersPanel";
import ReceiptsPanel from "./panels/ReceiptsPanel";
import TradersPanel from "./panels/TradersPanel";
import ProductsPanel from "./panels/ProductsPanel";

type MenuItem = "Products" | "Users" | "Traders" | "Receipts";

export default function Menu() {
  const [activeItem, setActiveItem] = useState<MenuItem>("Products");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { label: MenuItem; icon: React.ReactNode; color: string }[] = [
    { label: "Products", icon: <Package size={24} />, color: "cyan" },
    { label: "Users", icon: <Users size={24} />, color: "purple" },
    { label: "Traders", icon: <TrendingUp size={24} />, color: "pink" },
    { label: "Receipts", icon: <Receipt size={24} />, color: "green" },
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    setActiveItem(item);
    setIsMenuOpen(false);
  };

  const getItemColors = (itemLabel: MenuItem, itemColor: string) => {
    const isActive = activeItem === itemLabel;

    const colorMap: Record<string, { active: string; inactive: string; hover: string; shadow: string }> = {
      cyan: {
        active: "bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 text-white shadow-cyan-400/50",
        inactive: "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-cyan-300 hover:border-cyan-500",
        hover: "hover:shadow-lg hover:shadow-cyan-400/30 hover:scale-[1.02]",
        shadow: "from-cyan-400 to-cyan-300"
      },
      purple: {
        active: "bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400 text-white shadow-purple-400/50",
        inactive: "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-purple-300 hover:border-purple-500",
        hover: "hover:shadow-lg hover:shadow-purple-400/30 hover:scale-[1.02]",
        shadow: "from-purple-400 to-purple-300"
      },
      pink: {
        active: "bg-gradient-to-br from-pink-600 to-pink-700 border-pink-400 text-white shadow-pink-400/50",
        inactive: "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-pink-300 hover:border-pink-500",
        hover: "hover:shadow-lg hover:shadow-pink-400/30 hover:scale-[1.02]",
        shadow: "from-pink-400 to-pink-300"
      },
      green: {
        active: "bg-gradient-to-br from-green-600 to-green-700 border-green-400 text-white shadow-green-400/50",
        inactive: "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 text-green-300 hover:border-green-500",
        hover: "hover:shadow-lg hover:shadow-green-400/30 hover:scale-[1.02]",
        shadow: "from-green-400 to-green-300"
      }
    };

    const colors = colorMap[itemColor];
    return {
      base: isActive ? colors.active : colors.inactive,
      hover: colors.hover,
      accent: colors.shadow
    };
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
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 border-r-2 border-cyan-500 z-40 transition-all duration-500 shadow-2xl shadow-cyan-500/20 ${isMenuOpen ? "w-64" : "w-20"
          }`}
      >
        {/* Decorative accent line */}
        <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-purple-500"></div>

        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="mb-6 overflow-hidden">
            {isMenuOpen ? (
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-cyan-500 rounded-lg p-3 shadow-lg shadow-cyan-500/30">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider whitespace-nowrap">
                  Menu
                </h2>
              </div>
            ) : (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="relative overflow-hidden w-full p-2.5 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-cyan-400 hover:text-cyan-300 rounded-lg border-2 border-gray-600 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/30"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity"></div>
                <AlignJustify size={28} />
              </button>
            )}
          </div>

          {/* Menu Items */}
          <ul className="space-y-3 flex-1">
            {menuItems.map((item) => {
              const colors = getItemColors(item.label, item.color);
              const isActive = activeItem === item.label;

              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleMenuItemClick(item.label)}
                    className={`relative overflow-hidden w-full flex items-center gap-4 px-3 py-3 rounded-lg border-2 font-semibold transition-all duration-300 ${colors.base} ${colors.hover} ${!isMenuOpen ? "justify-center" : ""
                      } ${isActive ? "shadow-lg" : ""}`}
                    title={!isMenuOpen ? item.label : undefined}
                  >
                    {/* Accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colors.accent} ${isActive ? "opacity-100" : "opacity-0"}`}></div>

                    <span className="flex-shrink-0">{item.icon}</span>
                    {isMenuOpen && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative overflow-hidden mt-4 w-full py-3 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-cyan-400 hover:text-cyan-300 rounded-lg border-2 border-gray-600 hover:border-cyan-400 transition-all duration-300 flex items-center justify-center hover:shadow-lg hover:shadow-cyan-400/30"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
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
        className={`flex-1 p-8 flex flex-col transition-all duration-500 mr-8 ${isMenuOpen ? "ml-64" : "ml-20"
          }`}
      >
        {renderContent()}
      </div>
    </div>
  );
}