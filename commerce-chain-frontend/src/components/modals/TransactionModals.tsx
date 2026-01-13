import { useState, type RefObject } from "react";
import Modal, { type ModalHandle } from "./DeleteModal";
import SuccessProductAddingModal from "./SuccessProductAddingModal";
import type { ProductData, ProductInventory, TraderData } from "../../utils/dataTypesUtils";
import ConfirmationModal from "./ConfirmationModal";

export type TransactionMode = "RESTOCK" | "FULFILL";

interface TransactionModalsProps {
    successModalRef: RefObject<ModalHandle | null>;
    confirmModalRef: RefObject<ModalHandle | null>;
    resetNestedView: () => void;
    trader: TraderData;
    selectedProducts: ProductInventory[];
    products: ProductData[];
    totalCost: number;
    balance?: number;
    // New props for reusability
    mode: TransactionMode;
    onConfirmTransaction: () => Promise<Response>;
}

export default function TransactionModals({
    successModalRef,
    confirmModalRef,
    resetNestedView,
    trader,
    selectedProducts,
    totalCost,
    balance,
    products,
    mode,
    onConfirmTransaction
}: TransactionModalsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If Fulfilling (Selling), the balance increases. If Restocking (Buying), it decreases.
    const remainingBalance = balance
        ? balance
        : mode === "RESTOCK"
            ? trader.balance - totalCost
            : trader.balance + totalCost;

    const theme = mode === "RESTOCK"
        ? {
            btn: "bg-pink-600 hover:bg-pink-500 border-pink-400 text-white",
            cancel: "text-pink-300",
            border: "border-pink-500 shadow-pink-500/50"
        }
        : {
            btn: "bg-green-600 hover:bg-green-500 border-green-400 text-white",
            cancel: "text-green-300",
            border: "border-green-500 shadow-green-500/50"
        };

    const confirmLabel = mode === "RESTOCK" ? "Confirm Purchase" : "Fulfill Order";

    const handleConfirm = async () => {
        setIsSubmitting(true);

        try {
            // Execute the passed function (API call)
            const response = await onConfirmTransaction();

            if (response.ok) {
                const data = await response.json();
                console.log("Success: ", data.Message);

                confirmModalRef.current?.close();
                successModalRef.current?.open();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Transaction failed");
                successModalRef.current?.close();
            }
        } catch (err) {
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
            successModalRef.current?.close();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Success Modal */}
            <Modal
                ref={successModalRef}
                onConfirm={() => {
                    successModalRef.current?.close();
                    resetNestedView();
                }}
                confirmLabel="Close"
                showActions={true}
                cancelClassName="hidden"
                confirmClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-500 text-white font-semibold"
                dialogClassName={`backdrop:bg-black/80 bg-gray-800 border-2 rounded-lg p-8 shadow-2xl max-w-2xl w-full ${theme.border}`}
            >
                <SuccessProductAddingModal
                    trader={trader}
                    selectedProducts={selectedProducts}
                    totalCost={totalCost}
                    remainingBalance={remainingBalance}
                    mode={mode}
                />
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                ref={confirmModalRef}
                onConfirm={handleConfirm}
                onCancel={() => confirmModalRef.current?.close()}
                confirmLabel={isSubmitting ? "Processing..." : confirmLabel}
                cancelLabel="Review Again"
                confirmClassName={`px-6 py-3 rounded border-2 transition-all duration-200 hover:shadow-lg font-semibold ${theme.btn}`}
                cancelClassName={`px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 font-semibold ${theme.cancel}`}
                dialogClassName={`backdrop:bg-black/80 bg-gray-800 border-2 rounded-lg p-8 shadow-2xl max-w-3xl w-full ${theme.border}`}
            >
                <ConfirmationModal
                    trader={trader}
                    selectedProducts={selectedProducts}
                    totalCost={totalCost}
                    remainingBalance={remainingBalance}
                    products={products}
                    mode={mode}
                />
            </Modal>
        </>
    );
}