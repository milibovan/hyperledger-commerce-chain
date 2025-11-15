import { useEffect, useRef } from "react";
import CreateTraderForm from "../forms/CreateTraderForm";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { ProductData, TraderData } from "../../utils/dataTypesUtils";
import DepositMoneyForm from "../forms/DepositMoneyForm";
import UpdateTraderForm from "../forms/UpdateTraderForm";
import Modal from "../forms/DeleteModal";
import type { ModalHandle } from "../forms/DeleteModal";
import { type ActionType } from "../../utils/utils";
import {
  addButtonStyle,
  deleteButtonStyle,
  modalCancelButtonStyle,
  modalConfirmButtonStyle,
  modalDialogClassName,
  traderFontSemibold,
  updateButtonStyle,
} from "../../utils/stylingUtils";
import { useTraders } from "../customHooks/useTraders";
import { useEntityActions } from "../customHooks/useEntityActions";
import TraderDetails from "../overviews/TraderDetails";
import TradersList from "../lists/TradersList";
import AddProjectToTrader from "../forms/AddProductToTrader";
import ProductDetails from "../overviews/ProductDetails";

export default function TradersPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const {
    traders,
    products,
    loading,
    error,
    fetchTraders,
    fetchProductsByIds,
    clearProducts,
    deleteTrader,
  } = useTraders();

  const {
    action,
    selectedEntity: selectedTrader,
    viewDetails,
    selectedNestedEntity: selectedProduct,
    viewNestedDetails: viewProductDetails,
    handleAction,
    viewEntityDetails,
    viewNestedEntityDetails,
    resetActions,
    resetNestedView,
  } = useEntityActions<TraderData, ProductData>();

  // Fetch traders on mount
  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  // Fetch products when trader is selected and details view is shown
  useEffect(() => {
    if (selectedTrader && viewDetails) {
      fetchProductsByIds(
        selectedTrader["products-available"].map(
          (product) => product["product-id"]
        ) || []
      );
    } else {
      clearProducts();
    }
  }, [selectedTrader, viewDetails, fetchProductsByIds, clearProducts]);

  const handleDeleteClick = (trader: TraderData) => {
    handleAction("delete", trader);
    modalRef.current?.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTrader) return;

    const result = await deleteTrader(selectedTrader.id);
    modalRef.current?.close();

    if (result.success) {
      resetActions();
    }
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateTraderForm onSuccess={fetchTraders} />;
    }

    if (selectedTrader) {
      switch (action) {
        case "deposit":
          return (
            <DepositMoneyForm
              user={selectedTrader}
              onSuccess={fetchTraders}
              handleBackToList={resetActions}
            />
          );
        case "update":
          return (
            <UpdateTraderForm
              trader={selectedTrader}
              onSuccess={fetchTraders}
              handleAction={(actionType: ActionType, trader: TraderData) =>
                handleAction(actionType, trader)
              }
              handleBackToList={resetActions}
            />
          );

        case "addProduct":
          return (
            <AddProjectToTrader
              trader={selectedTrader}
              tradersProducts={products}
            />
          );
        default:
          if (viewProductDetails && selectedProduct) {
            return <ProductDetails entity={selectedProduct} />;
          }

          if (viewDetails) {
            return (
              <TraderDetails
                entity={selectedTrader}
                products={products}
                productsLoading={loading}
                addProduct={() => handleAction("addProduct", selectedTrader)}
                onProductClick={viewNestedEntityDetails}
              />
            );
          }
      }
    }
  };

  const handleBackClick = () => {
    if (viewProductDetails) {
      resetNestedView();
    } else {
      resetActions();
    }
  };

  if (action || viewDetails || viewProductDetails) {
    return (
      <div className="bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDeleteConfirm}
          confirmClassName={modalConfirmButtonStyle}
          cancelClassName={modalCancelButtonStyle + " text-pink-300"}
          dialogClassName={
            modalDialogClassName + " border-pink-500 shadow-pink-500/50"
          }
        >
          <h2 className="text-2xl font-bold text-pink-400 mb-4">
            Confirm Deletion
          </h2>
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className={traderFontSemibold}>
              {selectedTrader?.name} {selectedTrader?.["trader-type"]}
            </span>
            ?
          </p>
          <p className="text-sm text-gray-400 mt-2">ID: {selectedTrader?.id}</p>
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
              onClick={handleBackClick}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-pink-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Traders
            </button>
          </div>
          {action === null && selectedTrader && !viewProductDetails && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                onClick={() => handleAction("deposit", selectedTrader)}
                className={addButtonStyle + " mb-4"}
                title="Deposit Money"
              >
                <Plus size={18} /> Deposit
              </button>
              <button
                onClick={() => handleAction("update", selectedTrader)}
                className={updateButtonStyle + " mb-4"}
                title="Update"
              >
                <Edit size={18} /> Update
              </button>
              <button
                onClick={() => handleDeleteClick(selectedTrader)}
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
        cancelClassName={modalCancelButtonStyle + " text-pink-300"}
        dialogClassName={
          modalDialogClassName + " border-pink-500 shadow-pink-500/50"
        }
      >
        <h2 className="text-2xl font-bold text-pink-400 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className={traderFontSemibold}>
            {selectedTrader?.name} {selectedTrader?.["trader-type"]}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedTrader?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <TradersList
        entities={traders}
        loading={loading}
        error={error}
        onCreateClick={() => handleAction("create")}
        onEntityClick={viewEntityDetails}
        onDepositClick={(trader: TraderData) => handleAction("deposit", trader)}
        onUpdateClick={(trader: TraderData) => handleAction("update", trader)}
        onDeleteClick={handleDeleteClick}
      />
    </div>
  );
}
