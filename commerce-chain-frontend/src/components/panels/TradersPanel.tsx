import { useEffect, useRef } from "react";
import CreateTraderForm from "../forms/CreateTraderForm";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { OrderData, ProductData, ReceiptData, TraderData, UserData } from "../../utils/dataTypesUtils";
import DepositMoneyForm from "../forms/DepositMoneyForm";
import UpdateTraderForm from "../forms/UpdateTraderForm";
import Modal from "../modals/DeleteModal";
import type { ModalHandle } from "../modals/DeleteModal";
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
import { useTraders } from "../hooks/useTraders";
import { useEntityActions } from "../hooks/useEntityActions";
import TraderDetails from "../overviews/TraderDetails";
import TradersList from "../lists/TradersList";
import AddProjectToTrader from "../forms/AddProductToTrader";
import ProductDetails from "../overviews/ProductDetails";
import { useReceipts } from "../hooks/useReceipts";
import LoadingSkeleton from "../reusables/LoadingSkeleton";
import ReceiptDetails from "../overviews/ReceiptDetails";

export default function TradersPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const {
    traders,
    traderDetails,
    loading,
    error,
    fetchTraders,
    fetchTraderDetails,
    deleteTrader,
  } = useTraders();

  const { receiptDetails, fetchReceiptDetails } = useReceipts();

  const {
    action,
    selectedEntity: selectedTrader,
    viewDetails,
    selectedNestedEntity,
    viewNestedDetails,
    handleAction,
    viewEntityDetails,
    viewNestedEntityDetails,
    resetActions,
    resetNestedView,
  } = useEntityActions<TraderData, ProductData, ReceiptData, UserData, OrderData>();

  // Fetch traders on mount
  useEffect(() => {
    fetchTraders();
  }, [fetchTraders]);

  // Fetch details when trader is selected
  useEffect(() => {
    if (selectedTrader) {
      fetchTraderDetails(
        selectedTrader.id
      );
    }
  }, [selectedTrader, fetchTraderDetails]);

  useEffect(() => {
    if (!selectedNestedEntity) return;

    if ("trader-id" in selectedNestedEntity) {
      fetchReceiptDetails(selectedNestedEntity.id);
    }
  }, [selectedNestedEntity, fetchReceiptDetails]);

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

    if (selectedTrader && traderDetails) {
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
              tradersProducts={traderDetails["available-products"]}
              onSuccess={async () => {
                await fetchTraders();
                if (selectedTrader) {
                  await fetchTraderDetails(
                    selectedTrader.id
                  );
                }
              }}
            />
          );
        default:
          if (viewNestedDetails && selectedNestedEntity) {
            if ('price' in selectedNestedEntity) {
              return <ProductDetails entity={selectedNestedEntity} />;
            } else if ("trader-id" in selectedNestedEntity) {
              if (!receiptDetails) {
                return <LoadingSkeleton />;
              }
              return <ReceiptDetails entity={receiptDetails} />;
            }
          }



          if (viewDetails && traderDetails) {
            return (
              <TraderDetails
                entity={traderDetails}
                addProduct={() => handleAction("addProduct", selectedTrader)}
                onProductClick={viewNestedEntityDetails}
                onEntityClick={viewNestedEntityDetails}
              />
            );
          }
      }
    }
  };

  const handleBackClick = () => {
    if (viewNestedDetails) {
      resetNestedView();
    } else {
      resetActions();
    }
  };

  if (action || viewDetails || viewNestedDetails) {
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
          {action === null && selectedTrader && !viewNestedDetails && (
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
