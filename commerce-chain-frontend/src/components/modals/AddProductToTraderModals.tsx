import { useState, type RefObject } from "react";
import Modal, { type ModalHandle } from "./DeleteModal";
import SuccessProductAddingModal from "./SuccessProductAddingModal";
import type { ProductData, ProductInventory, TraderData } from "../../utils/dataTypesUtils";
import ConfirmationModal from "./ConfirmationModal";
import { addProductsToTrader } from "../../utils/utils";

interface AddProductToTraderModalProps {
    successModalRef: RefObject<ModalHandle | null>,
    confirmModalRef: RefObject<ModalHandle | null>,
    resetNestedView: () => void,
    trader: TraderData,
    selectedProducts: ProductInventory[],
    products: ProductData[],
    totalCost: number,
    balance?: number,
}

export default function AddProductToTraderModals({ successModalRef, confirmModalRef, resetNestedView, trader, selectedProducts, totalCost, balance, products }: AddProductToTraderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const remainingBalance = balance ? balance : trader.balance - totalCost

    const handleConfirm = async () => {
        setIsSubmitting(true);

        try {
            const response = await addProductsToTrader(selectedProducts, trader.id)

            if (response.ok) {
                const data = await response.json();
                console.log("Success: ", data.Message);

                confirmModalRef.current?.close();

                successModalRef.current?.open();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to add products");
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
            <Modal
                ref={successModalRef}
                onConfirm={() => {
                    successModalRef.current?.close();
                    resetNestedView();
                }}
                confirmLabel="Close"
                showActions={true}
                cancelClassName="hidden"
                confirmClassName="px-6 py-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/50 text-white font-semibold"
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50 max-w-2xl w-full"
            >
                <SuccessProductAddingModal
                    trader={trader}
                    selectedProducts={selectedProducts}
                    totalCost={totalCost}
                    remainingBalance={remainingBalance!}
                />
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                ref={confirmModalRef}
                onConfirm={handleConfirm}
                onCancel={() => confirmModalRef.current?.close()}
                confirmLabel={isSubmitting ? "Processing..." : "Confirm Purchase"}
                cancelLabel="Review Again"
                confirmClassName="px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded border-2 border-pink-400 transition-all duration-200 hover:shadow-lg hover:shadow-pink-400/50 text-white font-semibold"
                cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-pink-300 font-semibold"
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-pink-500 rounded-lg p-8 shadow-2xl shadow-pink-500/50 max-w-3xl w-full"
            >
                <ConfirmationModal
                    trader={trader}
                    selectedProducts={selectedProducts}
                    totalCost={totalCost}
                    remainingBalance={remainingBalance!}
                    products={products}
                />
            </Modal>
        </>
    )
}