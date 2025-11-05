import { Plus, Edit, Trash2 } from "lucide-react";
import { addButtonSm, updateButtonSm, deleteButtonSm, traderFontBold, entitiesNotFound} from "../../utils/stylingUtils";
import type { TraderData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";

export default function TradersList({
  entities: traders,
  loading,
  error,
  onCreateClick,
  onEntityClick: onTraderClick,
  onDepositClick,
  onUpdateClick,
  onDeleteClick,
}: ListProps<TraderData>) {
    return (
        <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-pink-400">Traders</h3>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50"
          >
            <Plus size={20} />
            Create Trader
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-pink-300 py-8">
            Loading traders...
          </div>
        ) : traders.length > 0 ? (
          <div className="space-y-3">
            {traders.map((trader : TraderData) => (
              <div
                key={trader.id}
                onClick={() => {
                  onTraderClick(trader)
                }}
                className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 cursor-pointer"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-pink-300">
                    {trader.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {trader["trader-type"]}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className={traderFontBold}>
                      ${trader.balance.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>onDepositClick(trader)}
                      className={addButtonSm}
                      title="Deposit Money"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => onUpdateClick(trader)}
                      className={updateButtonSm}
                      title="Update"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteClick(trader)}
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
          <div className={entitiesNotFound}>No traders found</div>
        )}
      </div>
    )
}