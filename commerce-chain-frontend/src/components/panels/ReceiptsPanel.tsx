import { useEffect, useRef } from "react";
import { Edit, Trash2 } from "lucide-react";
import type { ProductData, ReceiptData } from "../../utils/dataTypesUtils";
import type { ModalHandle } from "../modals/DeleteModal";
import { useReceipts } from "../hooks/useReceipts";
import ReceiptDetails from "../overviews/ReceiptDetails";
import { deleteButtonStyle, modalCancelButtonStyle, modalConfirmButtonStyle, modalDialogClassName, receiptFontSemibold, updateButtonStyle } from "../../utils/stylingUtils";
import Modal from "../modals/DeleteModal";
import { useEntityActions } from "../hooks/useEntityActions";
import ReceiptsList from "../lists/ReceiptList";
import { useTraders } from "../hooks/useTraders";
import ProductDetails from "../overviews/ProductDetails";

export default function ReceiptsPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const { receipts, loading, error, fetchReceipts, deleteReceipt } = useReceipts();
  const { products, fetchProductsByIds, clearProducts } = useTraders();

  const {
    action,
    selectedEntity: selectedReceipt,
    viewDetails,
    selectedNestedEntity: selectedProduct,
    viewNestedDetails: viewProductDetails,
    handleAction,
    viewEntityDetails,
    viewNestedEntityDetails,
    resetActions,
  } = useEntityActions<ReceiptData, ProductData>();

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Fetch products when receipt is selected and details view is shown
  useEffect(() => {
    if (selectedReceipt && viewDetails) {
      fetchProductsByIds(
        selectedReceipt.products.map(
          (product) => product["product-id"]
        ) || []
      );
    } else {
      clearProducts();
    }
  }, [selectedReceipt, viewDetails, fetchProductsByIds, clearProducts]);

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
          if (viewProductDetails && selectedProduct) {
            return <ProductDetails entity={selectedProduct} />;
          }

          if (viewDetails) {
            return <ReceiptDetails entity={selectedReceipt} products={products} productsLoading={loading} onProductClick={viewNestedEntityDetails} />;
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
              <p>Receipt between:</p> User {selectedReceipt?.["user-id"]} and
              <p>Trader {selectedReceipt?.["trader-id"]}</p>
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
              onClick={resetActions}
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-green-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to Receipts
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
            <p>Receipt between:</p> User {selectedReceipt?.["user-id"]} and
            <p>Trader {selectedReceipt?.["trader-id"]}</p>
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
