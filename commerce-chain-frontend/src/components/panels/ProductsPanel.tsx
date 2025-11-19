import { useEffect, useRef } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import CreateProductForm from "../forms/CreateProductForm";
import type { ProductData } from "../../utils/dataTypesUtils";
import UpdateProductForm from "../forms/UpdateProductForm";
import Modal from "../forms/DeleteModal";
import type { ModalHandle } from "../forms/DeleteModal";
import { useProducts } from "../hooks/useProducts";
import { useEntityActions } from "../hooks/useEntityActions";
import type { ActionType } from "../../utils/utils";
import ProductDetails from "../overviews/ProductDetails";
import {
  addButtonStyle,
  deleteButtonStyle,
  modalCancelButtonStyle,
  modalConfirmButtonStyle,
  modalDialogClassName,
  updateButtonStyle,
} from "../../utils/stylingUtils";
import ProductsList from "../lists/ProductsList";
import IncreaseProductQuantity from "../forms/IncreaseProductQuantity";

export default function ProductsPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const { products, loading, error, fetchProducts, deleteProduct } =
    useProducts();
  const {
    action,
    selectedEntity: selectedProduct,
    viewDetails,
    handleAction,
    viewEntityDetails,
    resetActions,
  } = useEntityActions<ProductData>();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteClick = (product: ProductData) => {
    handleAction("delete", product);
    modalRef.current?.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    const result = await deleteProduct(selectedProduct.id);
    modalRef.current?.close();

    if (result.success) {
      resetActions();
    }
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateProductForm onSuccess={fetchProducts} />;
    }

    if (selectedProduct) {
      switch (action) {
        case "deposit":
          return (
            <IncreaseProductQuantity
              product={selectedProduct}
              onSuccess={fetchProducts}
              handleBackToList={resetActions}
            />
          );
        case "update":
          return (
            <UpdateProductForm
              onSuccess={fetchProducts}
              product={selectedProduct!}
              handleActionClick={(
                actionType: ActionType,
                product: ProductData
              ) => handleAction(actionType, product)}
              handleBackToList={resetActions}
            />
          );
        default:
          if (viewDetails) {
            return <ProductDetails entity={selectedProduct} />;
          }
          return null;
      }
    }
  };

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 justify-between border-cyan-500 rounded-lg p-8 shadow-2xl shadow-cyan-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDeleteConfirm}
          confirmClassName={modalConfirmButtonStyle}
          cancelClassName={modalCancelButtonStyle + " text-cyan-300"}
          dialogClassName={
            modalDialogClassName + " border-cyan-500 shadow-cyan-500/50"
          }
        >
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            Confirm Deletion
          </h2>
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-cyan-300">
              {selectedProduct?.name} {selectedProduct?.["trader-type"]}
            </span>
            ?
          </p>
          <p className="text-sm text-gray-400 mt-2">
            ID: {selectedProduct?.id}
          </p>
          <p className="text-sm text-red-400 mt-4">
            This action cannot be undone.
          </p>
        </Modal>
        <div className="flex justify-between items-center mb-6">
          <div
            className="flex gap-2 my-4 justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetActions}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Products
            </button>
          </div>
          {action === null && selectedProduct && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                onClick={() => handleAction("deposit", selectedProduct)}
                className={addButtonStyle + " mb-4"}
                title="Increase Quantity"
              >
                <Plus size={18} /> Increase Quantity
              </button>
              <button
                onClick={() => handleAction("update", selectedProduct)}
                className={updateButtonStyle + " mb-4"}
                title="Update"
              >
                <Edit size={18} /> Update
              </button>
              <button
                onClick={() => handleDeleteClick(selectedProduct)}
                className={deleteButtonStyle + " mb-4"}
                title="Delete"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal
        ref={modalRef}
        onConfirm={handleDeleteConfirm}
        confirmClassName={modalConfirmButtonStyle}
        cancelClassName={modalCancelButtonStyle + " text-cyan-300"}
        dialogClassName={
          modalDialogClassName + " border-cyan-500 shadow-cyan-500/50"
        }
      >
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-cyan-300">
            {selectedProduct?.name} {selectedProduct?.["trader-type"]}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedProduct?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <ProductsList
        entities={products}
        loading={loading}
        error={error}
        onCreateClick={() => handleAction("create")}
        onEntityClick={viewEntityDetails}
        onDepositClick={(product: ProductData) =>
          handleAction("deposit", product)
        }
        onUpdateClick={(product: ProductData) =>
          handleAction("update", product)
        }
        onDeleteClick={handleDeleteClick}
      />
    </div>
  );
}
