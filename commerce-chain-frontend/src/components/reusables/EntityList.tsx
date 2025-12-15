import { Edit, Plus, Trash2 } from "lucide-react";
import { addButtonSm, deleteButtonSm, entitiesNotFound, ListColorSchemes, updateButtonSm } from "../../utils/stylingUtils";
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

    return (
        <div className={`bg-gray-800 border-2 ${colors.border} rounded-lg p-8 shadow-2xl ${colors.shadow}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-3xl font-bold ${colors.title}`}>{title}</h3>
                <button
                    onClick={onCreateClick}
                    className={`flex items-center gap-2 px-6 py-3 ${colors.button} text-white font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg`}
                >
                    <Plus size={20} />
                    {createButtonLabel}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
                    <span className="font-semibold">{error}</span>
                </div>
            )}

            {loading ? (
                <div className={`text-center ${colors.loading} py-8`}>
                    {defaultLoadingMessage}
                </div>
            ) : entities.length > 0 ? (
                <div className="space-y-3">
                    {entities.map((entity) => (
                        <div
                            key={getEntityId(entity)}
                            onClick={() => onEntityClick(entity)}
                            className={`flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 ${colors.itemBorder} transition-all duration-200 hover:shadow-lg ${colors.itemShadow} cursor-pointer`}
                        >
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
                                            className={addButtonSm}
                                            title="Deposit"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onUpdateClick(entity)}
                                        className={updateButtonSm}
                                        title="Update"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteClick(entity)}
                                        className={deleteButtonSm}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={entitiesNotFound}>{defaultEmptyMessage}</div>
            )}
        </div>
    );
}