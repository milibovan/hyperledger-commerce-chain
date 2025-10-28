import { useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  Receipt,
  X,
  ArrowBigRight
} from "lucide-react";
import UsersPanel from "./panels/UsersPanel";
import ReceiptsPanel from "./panels/ReceiptsPanel";
import TradersPanel from "./panels/TradersPanel";
import ProductsPanel from "./panels/ProductsPanel";

type MenuItem = "Products" | "Users" | "Traders" | "Receipts";

export default function Menu() {
  const [activeItem, setActiveItem] = useState<MenuItem>('Products');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { label: MenuItem; icon: React.ReactNode }[] = [
    { label: 'Products', icon: <Package size={24} /> },
    { label: 'Users', icon: <Users size={24} /> },
    { label: 'Traders', icon: <TrendingUp size={24} /> },
    { label: 'Receipts', icon: <Receipt size={24} /> },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex mr-10">
      {/* Sidebar - Toggle Bar */}
      <div
        className={`fixed left-0 top-0 h-full z-40 flex transition-all duration-300 ${
          isMenuOpen ? 'w-64' : 'w-12'
        }`}
        onMouseEnter={() => setIsMenuOpen(true)}
    onMouseLeave={() => setIsMenuOpen(false)}
      >
        {/* Menu Content */}
        <nav
          className={`flex-1 bg-gray-800 border-r-2 border-cyan-500 overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'p-6' : 'p-0'
          }`}
        >
          {isMenuOpen && (
            <>
              <h2 className="text-2xl font-bold text-cyan-400 mb-8 uppercase tracking-wider">
                Menu
              </h2>
              <ul className="space-y-4">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => handleMenuItemClick(item.label)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded border-2 font-semibold transition-all duration-200 ${
                        activeItem === item.label
                          ? 'bg-cyan-500 border-cyan-300 text-gray-900 shadow-lg shadow-cyan-400/50'
                          : 'bg-gray-700 border-gray-600 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Toggle Button */}
        <button
          className="w-12 bg-gray-800 border-r-2 border-cyan-500 hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2 text-cyan-400">
            {isMenuOpen ? (
              <X size={24} />
            ) : (
              <>
                <ArrowBigRight size={20} />
              </>
            )}
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-8 flex flex-col transition-all duration-300 ${isMenuOpen ? 'ml-64' : 'ml-12'}`}>
        {renderContent()}
      </div>
    </div>
  );
}
