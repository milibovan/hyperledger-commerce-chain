import type { InfoSectionProps } from "../../utils/propsUtils";
import { GRID_RESPONSIVE } from "../../utils/stylingUtils";
import { FileText, Hash } from "lucide-react";

export default function InfoSection({ title, id, label, value, entity, onEntityClick }: InfoSectionProps) {
    return (
        <div>
            <span className="text-xl font-bold text-green-400">{title}</span>
            <div
                tabIndex={0}
                className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-green-400 hover:shadow-xl hover:shadow-green-400/50 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 hover:scale-[1.01] mt-4"
                onClick={() => onEntityClick?.(entity)}
            >
                {/* Decorative accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-400"></div>

                <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-green-900/30">
                            <FileText size={22} className="text-green-300" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-lg text-green-300">{title}</h5>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Hash size={12} />
                                {id}
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className={`${GRID_RESPONSIVE} gap-4`}>
                        <div className="p-3 bg-gray-800/50 rounded border border-green-500/30">
                            <p className="text-xs text-gray-400 mb-1">ID</p>
                            <p className="font-semibold text-green-300">{id}</p>
                        </div>
                        <div className="p-3 bg-gray-800/50 rounded border border-green-500/30">
                            <p className="text-xs text-gray-400 mb-1">{label}</p>
                            <p className="font-semibold text-gray-300">{value}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}