import { AlertCircle, CheckCircle, Send, Package } from "lucide-react";
import { channels, getFormattedDate, type ProductData, type RequestDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import ProductCard from "../reusables/ProductCard";
import { useState, useRef } from "react";
import { host } from "../../utils/utils";
import type { ModalHandle } from "../modals/DeleteModal";
import Modal from "../modals/DeleteModal";

export default function UpdateRequest({ entity: request, selectedTrader }: DetailsProps<RequestDetails>) {
    const getProductQuantity = (productId: string) => {
        return request.request.products.find(product => product["product-id"] === productId)?.quantity
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const confirmModal = useRef<ModalHandle>(null);
    const successModal = useRef<ModalHandle>(null);

    const handleAssignClick = () => {
        setError(null);
        confirmModal.current?.open();
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const response = await fetch(
                `${host}/request/approve/${selectedTrader?.id}/${request.request.id}/${channels[0]}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        "user-id": request.user.id,
                        "user-email": request.user.email,
                        "trader-name": selectedTrader?.name,
                        "due-date": request.request["due-date"],
                        "total-cost": request.request["total-cost"]
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSuccessMessage(data.Message || "Request assigned successfully!");
                successModal.current?.open();
            } else {
                const errorData = await response.json();
                setError(errorData.Message || "Failed to update request");
            }
        } catch (err) {
            setError(`Error connecting to server: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <EntityDetailsDisplay
                title="Request Details"
                titleColor="text-amber-400"
                labelColor="text-amber-300"
                borderColor="border-amber-400"
                fields={[
                    { label: 'ID', value: request.request.id },
                    {
                        label: 'Request value',
                        value: request.request["total-cost"],
                        formatter: (val) => `$${val.toFixed(2)}`
                    },
                    { label: 'Created Date', value: request.request["created-date"], formatter: (val) => getFormattedDate(val) },
                    { label: 'Due Date', value: request.request["due-date"], formatter: (val) => getFormattedDate(val) },
                ]}
            />
            <div className="mt-4">
                <EntityDetailsDisplay
                    title="User Details"
                    titleColor="text-amber-400"
                    labelColor="text-amber-300"
                    hasBorder={true}
                    borderColor="border-amber-400"
                    fields={[
                        { label: 'ID', value: request.user.id },
                        { label: 'Email', value: request.user.email },
                        {
                            label: 'Name',
                            value: `${request.user.name} ${request.user.surname}`
                        },
                        {
                            label: 'Balance',
                            value: request.user.balance,
                            formatter: (val) => `$${val.toFixed(2)}`
                        },
                        {
                            label: 'Orders placed',
                            value: request.user["orders-ids"].length
                        },
                        {
                            label: 'Requests placed',
                            value: request.user["requests-ids"].length
                        }
                    ]}
                />
            </div>
            <div className="grid grid-cols-1 gap-4 text-gray-300 pb-4 border-y-2 border-amber-400">
                <NestedEntityListSection
                    title="Products bought"
                    items={request.products || []}
                    colorScheme="amber"
                    icon="package"
                    className="mt-4"
                    emptyMessage="No orders"
                    renderItem={(product: ProductData) => (
                        <ProductCard
                            product={product}
                            quantity={getProductQuantity(product.id)}
                            colorScheme="amber"
                        />
                    )}
                />
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-900 border-2 border-red-500 text-red-200 rounded">
                    <AlertCircle size={20} />
                    <span className="font-semibold">{error}</span>
                </div>
            )}

            <div className="mt-5 flex justify-end">
                <button
                    className="flex items-center bg-green-600 hover:bg-green-500 border-green-400 gap-2 px-6 py-3 text-white font-semibold rounded border-2 transition-all duration-200 hover:shadow-lg"
                    disabled={loading}
                    onClick={handleAssignClick}
                >
                    <Send size={20} />
                    {loading ? "Assigning..." : "Assign"}
                </button>
            </div>

            {/* Confirmation Modal */}
            <Modal
                ref={confirmModal}
                onConfirm={handleSubmit}
                confirmLabel="Confirm Assignment"
                cancelLabel="Cancel"
                confirmClassName="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded border-2 border-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/50 text-white font-semibold"
                cancelClassName="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded border-2 border-gray-600 transition-all duration-200 text-amber-300 font-semibold"
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-amber-500 rounded-lg p-8 shadow-2xl shadow-amber-500/50 max-w-2xl w-full"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-900/30 rounded-full">
                        <Package size={24} className="text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-400">Confirm Request Assignment</h2>
                </div>

                <p className="text-gray-300 mb-6">
                    You are about to assign this request to{" "}
                    <span className="font-semibold text-amber-300">{selectedTrader?.name}</span>:
                </p>

                {/* Request Summary */}
                <div className="bg-gray-900/50 border border-amber-500/30 rounded-lg p-4 mb-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-300">
                            <span>Request ID:</span>
                            <span className="font-semibold text-amber-300">{request.request.id}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>User:</span>
                            <span className="font-semibold text-amber-300">
                                {request.user.name} {request.user.surname}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Due Date:</span>
                            <span className="font-semibold text-amber-300">
                                {getFormattedDate(request.request["due-date"])}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span>Products:</span>
                            <span className="font-semibold text-amber-300">
                                {request.request.products.length} items
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cost Summary */}
                <div className="bg-amber-900/20 border-2 border-amber-500 rounded-lg p-4">
                    <div className="flex justify-between text-lg">
                        <span className="font-semibold text-amber-300">Total Cost:</span>
                        <span className="font-bold text-amber-400">
                            ${request.request["total-cost"].toFixed(2)}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mt-4 text-center">
                    This action will assign the request to the selected trader.
                </p>
            </Modal>

            {/* Success Modal */}
            <Modal
                ref={successModal}
                showActions={false}
                dialogClassName="backdrop:bg-black/80 bg-gray-800 border-2 border-green-500 rounded-lg p-8 shadow-2xl shadow-green-500/50 max-w-md w-full"
            >
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-green-900/30 rounded-full">
                            <CheckCircle size={48} className="text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-green-400 mb-3">Success!</h2>
                    <p className="text-gray-300 mb-6">{successMessage}</p>
                    <button
                        onClick={() => successModal.current?.close()}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded border-2 border-green-400 transition-all duration-200 hover:shadow-lg text-white font-semibold"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </>
    )
}