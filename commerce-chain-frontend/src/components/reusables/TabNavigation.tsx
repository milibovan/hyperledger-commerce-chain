import type { TabNavigationProps } from "../../utils/propsUtils";

export default function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
}: TabNavigationProps) {
    return (
        <div className="flex gap-2 border-b-2 border-purple-500">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-6 py-3 font-semibold transition-all ${activeTab === tab.id
                        ? "text-purple-300 border-b-4 border-purple-400 -mb-0.5"
                        : "text-gray-400 hover:text-purple-300"
                        }`}
                >
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    {tab.label}
                    {tab.badge && (
                        <span
                            className={`ml-2 px-2 py-1 ${tab.badge.colorClass} rounded text-white text-xs`}
                        >
                            {tab.badge.text}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}