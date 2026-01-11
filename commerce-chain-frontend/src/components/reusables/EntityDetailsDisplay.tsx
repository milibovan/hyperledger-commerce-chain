import type { FieldConfig } from "../../utils/dataTypesUtils";
import type { EntityDetailsDisplayProps } from "../../utils/propsUtils";
import { Info } from "lucide-react";

export default function EntityDetailsDisplay({
    title,
    titleColor,
    labelColor,
    fields,
    columns = 2,
    hasBorder = false,
    borderColor,
}: EntityDetailsDisplayProps) {
    const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';

    const renderValue = (field: FieldConfig) => {
        if (field.formatter) {
            return field.formatter(field.value);
        }
        if (field.value instanceof Date) {
            return field.value.toISOString();
        }
        return field.value;
    };

    // Extract theme color for icon background
    const getThemeColor = () => {
        if (titleColor.includes('purple')) return 'bg-purple-900/30';
        if (titleColor.includes('pink')) return 'bg-pink-900/30';
        if (titleColor.includes('amber')) return 'bg-amber-900/30';
        if (titleColor.includes('green')) return 'bg-green-900/30';
        if (titleColor.includes('indigo')) return 'bg-indigo-900/30';
        return 'bg-gray-700';
    };

    const getAccentGradient = () => {
        if (titleColor.includes('purple')) return 'from-purple-500 to-purple-400';
        if (titleColor.includes('pink')) return 'from-pink-500 to-pink-400';
        if (titleColor.includes('amber')) return 'from-amber-500 to-amber-400';
        if (titleColor.includes('green')) return 'from-green-500 to-green-400';
        if (titleColor.includes('indigo')) return 'from-indigo-500 to-indigo-400';
        return 'from-gray-500 to-gray-400';
    };

    const getBorderStyle = () => {
        if (!hasBorder || !borderColor) return '';
        return `border-b-2 ${borderColor} pb-4`;
    };

    return (
        <div className={`${getBorderStyle()}`}>
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getThemeColor()}`}>
                    <Info size={20} className={titleColor} />
                </div>
                <h3 className={`text-2xl font-bold ${titleColor}`}>{title}</h3>
            </div>

            {/* Fields Grid */}
            <div className={`grid ${gridCols} gap-3`}>
                {fields.map((field, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-all duration-200"
                    >
                        {/* Subtle accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getAccentGradient()} opacity-50`}></div>

                        <div className="relative">
                            <p className={`text-xs font-semibold ${labelColor} mb-1 uppercase tracking-wide`}>
                                {field.label}
                            </p>
                            <p className={`font-bold text-gray-200 ${field.colour || ''}`}>
                                {renderValue(field)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}