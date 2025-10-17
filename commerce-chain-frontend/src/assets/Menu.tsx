import { useState } from 'react';
import { Package, Users, TrendingUp, Receipt } from 'lucide-react';

type MenuItem = 'Products' | 'Users' | 'Traders' | 'Receipts';

export default function Menu() {
  const [activeItem, setActiveItem] = useState<MenuItem>('Products');

  const menuItems: { label: MenuItem; icon: React.ReactNode }[] = [
    { label: 'Products', icon: <Package size={24} /> },
    { label: 'Users', icon: <Users size={24} /> },
    { label: 'Traders', icon: <TrendingUp size={24} /> },
    { label: 'Receipts', icon: <Receipt size={24} /> },
  ];

  const renderContent = () => {
    switch (activeItem) {
      case 'Products':
        return <ProductsPanel />;
      case 'Users':
        return <UsersPanel />;
      case 'Traders':
        return <TradersPanel />;
      case 'Receipts':
        return <ReceiptsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
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
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
}

function ProductsPanel() {
  return (
    <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
      <h3 className="text-3xl font-bold text-cyan-400 mb-4">Products</h3>
      <p className="text-gray-300">Products panel content goes here</p>
    </div>
  );
}

function UsersPanel() {
  return (
    <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
      <h3 className="text-3xl font-bold text-purple-400 mb-4">Users</h3>
      <p className="text-gray-300">Users panel content goes here</p>
    </div>
  );
}

function TradersPanel() {
  return (
    <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
      <h3 className="text-3xl font-bold text-pink-400 mb-4">Traders</h3>
      <p className="text-gray-300">Traders panel content goes here</p>
    </div>
  );
}

function ReceiptsPanel() {
  return (
    <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
      <h3 className="text-3xl font-bold text-green-400 mb-4">Receipts</h3>
      <p className="text-gray-300">Receipts panel content goes here</p>
    </div>
  );
}