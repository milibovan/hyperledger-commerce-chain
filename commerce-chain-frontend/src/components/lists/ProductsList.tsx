import { Plus, Edit, Trash2 } from "lucide-react";
import type { ProductData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import {
  addButtonSm,
  updateButtonSm,
  deleteButtonSm,
  entitiesNotFound,
} from "../../utils/stylingUtils";
import { getFormattedDate } from "../../utils/dataTypesUtils";


export default function ProductsList({
  entities: products,
  loading,
  error,
  onCreateClick,
  onEntityClick: onProductClick,
  onDepositClick,
  onUpdateClick,
  onDeleteClick,
}: ListProps<ProductData>) {

  return (
    <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-cyan-400">Products</h3>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded border-2 border-cyan-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50"
        >
          <Plus size={20} />
          Create Product
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-cyan-300 py-8">
          Loading products...
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => {
                onProductClick(product);
              }}
              className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-cyan-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-400/50 cursor-pointer"
            >
              <div className="flex-1">
                <h4 className="font-bold text-lg text-cyan-300">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-400">
                  {getFormattedDate(product["expiry-date"])}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="font-bold text-cyan-300">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onDepositClick(product)}
                    className={addButtonSm}
                    title="Deposit"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => onUpdateClick(product)}
                    className={updateButtonSm}
                    title="Update"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteClick(product)}
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
        <div className={entitiesNotFound}>No products found</div>
      )}
    </div>
  );
}
