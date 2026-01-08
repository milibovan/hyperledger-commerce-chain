import { Package, Plus, Receipt, CircleQuestionMark } from "lucide-react";
import type { EntityListSectionProps as NestedEntityListSectionProps } from "../../utils/propsUtils";
import { colorSchemes } from "../../utils/stylingUtils";

const NestedEntityListSection = <T,>({
    title,
    items,
    colorScheme,
    icon = 'package',
    customIcon,
    renderItem,
    emptyMessage = 'No items available',
    isLoading = false,
    loadingComponent,
    actionButton,
    headerContent,
    hasBorder = false,
    borderPosition = 'right',
    className = '',
}: NestedEntityListSectionProps<T>) => {
    const colors = colorSchemes[colorScheme];

    const getIcon = () => {
        if (customIcon) return customIcon;
        if (icon === 'receipt') return <Receipt size={20} />;
        if (icon === 'request') return <CircleQuestionMark size={20} />;
        return <Package size={20} />;
    };

    const getBorderClass = () => {
        if (!hasBorder) return '';
        const borderMap = {
            top: 'border-t-2',
            bottom: 'border-b-2',
            right: 'border-r-2 pr-4',
            left: 'border-l-2 pl-4',
            y: 'border-y-2',
        };
        return `${borderMap[borderPosition]} ${colors.border}`;
    };

    return (
        <div className={`${getBorderClass()} ${className}`}>
            <div className="flex items-center justify-between mb-3.5">
                <h4 className={`text-xl font-bold ${colors.text} flex items-center gap-2`}>
                    {getIcon()}
                    {title} ({items?.length || 0})
                </h4>
                {actionButton && (
                    <button
                        onClick={actionButton.onClick}
                        className={`flex items-center px-3 py-2 gap-3 ${colors.button} text-white font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg ${colors.shadow}`}
                        title={actionButton.label}
                    >
                        {actionButton.icon || <Plus size={18} />}
                        {actionButton.label}
                    </button>
                )}
                {/* Render headerContent if provided */}
                {headerContent && (
                    <>
                        {headerContent}
                    </>
                )}
            </div>


            {isLoading ? (
                loadingComponent || <div className="text-center text-gray-400 py-4">Loading...</div>
            ) : items && items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index}>
                            {renderItem(item, index)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center text-gray-400 py-4 bg-gray-700 rounded border ${colors.border}`}>
                    {emptyMessage}
                </div>
            )}
        </div>
    );
};

export default NestedEntityListSection;