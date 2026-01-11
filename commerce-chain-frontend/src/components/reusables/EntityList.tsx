import { Edit, Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { addButtonSm, deleteButtonSm, getCreateButtonStyle, ListColorSchemes, updateButtonSm } from "../../utils/stylingUtils";
import type { EntityListProps } from "../../utils/propsUtils";

export default function EntityList<T>({
    entities,
    loading,
    error,
    colorScheme,
    title,
    createButtonLabel,
    loadingMessage,
    emptyMessage,
    onCreateClick,
    onEntityClick,
    onDepositClick,
    onUpdateClick,
    onDeleteClick,
    renderMainContent,
    renderSideContent,
    getEntityId,
}: EntityListProps<T>) {
    const colors = ListColorSchemes[colorScheme];
    const defaultLoadingMessage = loadingMessage || `Loading ${title.toLowerCase()}...`;
    const defaultEmptyMessage = emptyMessage || `No ${title.toLowerCase()} found`;

    // Get theme-specific classes
    const getThemeIcon = () => {
        if (colorScheme === 'purple') return 'bg-purple-900/30';
        if (colorScheme === 'pink') return 'bg-pink-900/30';
        if (colorScheme === 'amber') return 'bg-amber-900/30';
        if (colorScheme === 'green') return 'bg-green-900/30';
        if (colorScheme === 'indigo') return 'bg-indigo-900/30';
        return 'bg-gray-700';
    };

    const getAccentGradient = () => {
        if (colorScheme === 'purple') return 'from-purple-500 to-purple-400';
        if (colorScheme === 'pink') return 'from-pink-500 to-pink-400';
        if (colorScheme === 'amber') return 'from-amber-500 to-amber-400';
        if (colorScheme === 'green') return 'from-green-500 to-green-400';
        if (colorScheme === 'indigo') return 'from-indigo-500 to-indigo-400';
        return 'from-gray-500 to-gray-400';
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${colors.border} rounded-lg shadow-2xl ${colors.shadow}`}>
            {/* Decorative accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getAccentGradient()}`}></div>

            <div className="p-8">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-3xl font-bold ${colors.title}`}>{title}</h3>
                    <button
                        onClick={onCreateClick}
                        className={getCreateButtonStyle(colorScheme)}
                    >
                        <Plus size={20} />
                        {createButtonLabel}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900/40 border-2 border-red-500 text-red-200 rounded-lg">
                        <AlertCircle size={20} />
                        <span className="font-semibold">{error}</span>
                    </div>
                )}

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 size={48} className={`${colors.loading} animate-spin mb-4`} />
                        <p className={`text-lg font-medium ${colors.loading}`}>
                            {defaultLoadingMessage}
                        </p>
                    </div>
                ) : entities.length > 0 ? (
                    <div className="space-y-3">
                        {entities.map((entity) => (
                            <div
                                key={getEntityId(entity)}
                                onClick={() => onEntityClick(entity)}
                                className={`relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg border-2 ${colors.itemBorder} transition-all duration-300 hover:shadow-xl ${colors.itemShadow} cursor-pointer hover:scale-[1.01]`}
                            >
                                {/* Item accent line */}
                                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getAccentGradient()} opacity-70`}></div>

                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex-1">
                                        {renderMainContent(entity)}
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            {renderSideContent(entity)}
                                        </div>
                                        <div
                                            className="flex gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {onDepositClick && (
                                                <button
                                                    onClick={() => onDepositClick(entity)}
                                                    className={`${addButtonSm} hover:scale-110 transition-transform`}
                                                    title="Deposit"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onUpdateClick(entity)}
                                                className={`${updateButtonSm} hover:scale-110 transition-transform`}
                                                title="Update"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteClick(entity)}
                                                className={`${deleteButtonSm} hover:scale-110 transition-transform`}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600">
                        <div className={`p-4 rounded-full ${getThemeIcon()} mb-4`}>
                            <AlertCircle size={48} className={colors.loading} />
                        </div>
                        <p className="text-xl font-semibold text-gray-400">
                            {defaultEmptyMessage}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Click the "{createButtonLabel}" button to get started
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}