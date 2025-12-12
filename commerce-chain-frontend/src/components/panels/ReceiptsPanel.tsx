import { useEffect, useRef } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { OrderData, ProductData, ReceiptData, TraderData, UserData } from "../../utils/dataTypesUtils";
import type { ModalHandle } from "../modals/DeleteModal";
import { useReceipts } from "../hooks/useReceipts";
import ReceiptDetails from "../overviews/ReceiptDetails";
import { deleteButtonStyle, modalCancelButtonStyle, modalConfirmButtonStyle, modalDialogClassName, receiptFontSemibold, updateButtonStyle } from "../../utils/stylingUtils";
import Modal from "../modals/DeleteModal";
import { useEntityActions } from "../hooks/useEntityActions";
import ReceiptsList from "../lists/ReceiptList";
import ProductDetails from "../overviews/ProductDetails";
import UserDetails from "../overviews/UserDetails";
import TraderDetails from "../overviews/TraderDetails";
import { useUsers } from "../hooks/useUsers";
import { useTraders } from "../hooks/useTraders";
import LoadingSkeleton from "../reusables/LoadingSkeleton";

export default function ReceiptsPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const { receipts, receiptDetails, loading, error, fetchReceipts, fetchReceiptDetails, deleteReceipt } = useReceipts();

  const {
    action,
    selectedEntity: selectedReceipt,
    viewDetails,
    selectedNestedEntity,
    viewNestedDetails,
    handleAction,
    viewEntityDetails,
    viewNestedEntityDetails,
    resetActions,
    resetNestedView
  } = useEntityActions<ReceiptData, ProductData, UserData, TraderData, OrderData>();

  const { userDetails, fetchUserDetails } = useUsers();
  const { traderDetails, fetchTraderDetails } = useTraders();

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Fetch products when receipt is selected and details view is shown
  useEffect(() => {
    if (selectedReceipt) {
      fetchReceiptDetails(
        selectedReceipt.id
      );
    }
  }, [selectedReceipt, fetchReceiptDetails]);

  useEffect(() => {
    if (!selectedNestedEntity) return;

    if ("surname" in selectedNestedEntity) {
      fetchUserDetails(selectedNestedEntity.id);
    }
    else if (!("price" in selectedNestedEntity)) {
      fetchTraderDetails(selectedNestedEntity.id);
    }
  }, [fetchTraderDetails, fetchUserDetails, selectedNestedEntity]);

  const handleDeleteClick = (receipt: ReceiptData) => {
    handleAction("delete", receipt);
    modalRef.current?.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReceipt) return;

    const result = await deleteReceipt(selectedReceipt.id);
    modalRef.current?.close();

    if (result.success) {
      resetActions();
    }
  };

  const renderContent = () => {
    if (action === "create") {
      // return <CreateReceiptForm onSuccess={fetchReceipts} />;
    }
    if (selectedReceipt) {
      switch (action) {
        // case "storn":
        //   return (
        //     <div className="text-gray-300">
        //       Increase quantity form for {selectedReceipt?.id}{" "}
        //       {selectedReceipt?.["user-id"]}
        //       {selectedReceipt?.["trader-id"]}
        //     </div>
        //   );
        case "update":
          return (
            <div className="text-gray-300">
              Update form for {selectedReceipt?.id} {selectedReceipt?.["user-id"]}
              {selectedReceipt?.["trader-id"]}
            </div>
          );
        case "delete":
          return (
            <div className="text-gray-300">
              Delete confirmation for {selectedReceipt?.id} {selectedReceipt?.["user-id"]}
              {selectedReceipt?.["trader-id"]}
            </div>
          );
        default:
          if (viewNestedDetails && selectedNestedEntity) {
            if ('price' in selectedNestedEntity) {
              return <ProductDetails entity={selectedNestedEntity as ProductData} />;
            } else if ('surname' in selectedNestedEntity) {
              if (!userDetails) {
                return <LoadingSkeleton />;
              }
              return <UserDetails entity={userDetails} />;
            } else {
              if (!traderDetails) {
                return <LoadingSkeleton />;
              }
              return <TraderDetails entity={traderDetails} />;
            }
          }

          if (viewDetails && receiptDetails) {
            return <ReceiptDetails entity={receiptDetails} products={receiptDetails.products} productsLoading={loading} onProductClick={viewNestedEntityDetails} onEntityClick={viewNestedEntityDetails} />;
          }
          return null;
      }
    };
  }

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDeleteConfirm}
          confirmClassName={modalConfirmButtonStyle}
          cancelClassName={modalCancelButtonStyle + " text-green-300"}
          dialogClassName={
            modalDialogClassName + " border-green-500 shadow-green-500/50"
          }
        >
          <h2 className="text-2xl font-bold text-green-400 mb-4">
            Confirm Deletion
          </h2>
          <div className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className={receiptFontSemibold}>
              <p>Receipt between:</p> User {receiptDetails?.user.name} {receiptDetails?.user.surname} and
              <p>Trader {receiptDetails?.trader.name}</p>
              <p>created on {selectedReceipt?.date.toString()} ?</p>
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2">ID: {selectedReceipt?.id}</p>
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
              onClick={() => {
                if (viewNestedDetails) {
                  resetNestedView();
                } else {
                  resetActions();
                }
              }}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to {viewNestedDetails ? "Receipt" : "Receipts"}
            </button>
          </div>
          {action === null && selectedReceipt && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                onClick={() => handleAction("update", selectedReceipt!)}
                className={updateButtonStyle + " mb-4"}
                title="Storn"
              >
                <Edit size={18} /> Storn
              </button>
              <button
                onClick={() => handleDeleteClick(selectedReceipt!)}
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
        cancelClassName={modalCancelButtonStyle + " text-green-300"}
        dialogClassName={
          modalDialogClassName + " border-green-500 shadow-green-500/50"
        }
      >
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          Confirm Deletion
        </h2>
        <div className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className={receiptFontSemibold}>
            <p>Receipt between:</p> User {receiptDetails?.user.name} {receiptDetails?.user.surname} and
            <p>Trader {receiptDetails?.trader.name}</p>
            <p>created on {selectedReceipt?.date.toString()} ?</p>
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedReceipt?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <ReceiptsList
        entities={receipts}
        loading={loading}
        error={error}
        onCreateClick={() => handleAction("create")}
        onEntityClick={viewEntityDetails}
        onDepositClick={(receipt: ReceiptData) => handleAction("deposit", receipt)}
        onUpdateClick={(receipt: ReceiptData) => handleAction("update", receipt)}
        onDeleteClick={handleDeleteClick}
      />
    </div>
  );
}
