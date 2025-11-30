import { Plus, Edit, Trash2 } from "lucide-react";
import { getFormattedDate, type ReceiptData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import { updateButtonSm, deleteButtonSm, entitiesNotFound, createReceiptButton } from "../../utils/stylingUtils";


export default function ReceiptsList({
    entities: receipts,
    loading,
    error,
    onCreateClick,
    onEntityClick: onReceiptClick,
    onUpdateClick,
    onDeleteClick,
}: ListProps<ReceiptData>) {
    return (
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-green-400">Receipts</h3>
                <button
                    onClick={onCreateClick}
                    className={createReceiptButton}
                >
                    <Plus size={20} />
                    Create Receipt
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
                    <span className="font-semibold">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="text-center text-green-300 py-8">Loading receipts...</div>
            ) : receipts.length > 0 ? (
                <div className="space-y-3">
                    {receipts.map((receipt) => (
                        <div
                            key={receipt.id}
                            onClick={() => {
                                onReceiptClick(receipt);
                            }}
                            className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50 cursor-pointer"
                        >
                            <div className="flex-1">
                                <p className="text-gray-400">
                                    Between
                                </p>
                                <h4 className="font-bold text-lg text-green-300">
                                    {receipt["user-id"]}  
                                </h4>
                                <p className="text-gray-400">
                                    and
                                </p>
                                <h4 className="font-bold text-lg text-green-300">
                                    {receipt["trader-id"]}  
                                </h4>
                                <p className="text-sm text-gray-400">
                                    {getFormattedDate(receipt.date)}
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Products no:</p>
                                    <p className="font-bold text-green-300">
                                        {receipt.products.length}
                                    </p>
                                </div>
                                <div
                                    className="flex gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => onUpdateClick(receipt)}
                                        className={updateButtonSm}
                                        title="Update"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteClick(receipt)}
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
                <div className={entitiesNotFound}>No receipts found</div>
            )}
        </div>
    );
}
