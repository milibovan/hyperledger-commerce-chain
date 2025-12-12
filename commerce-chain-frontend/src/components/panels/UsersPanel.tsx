import { useEffect, useRef } from "react";
import type { OrderData, ProductData, ReceiptData, TraderData, UserData } from "../../utils/dataTypesUtils";
import { Plus, Edit, Trash2, ShoppingBag } from "lucide-react";
import CreateUserForm from "../forms/CreateUserForm";
import DepositMoneyForm from "../forms/DepositMoneyForm";
import UpdateUserForm from "../forms/UpdateUserForm";
import type { ModalHandle } from "../modals/DeleteModal";
import Modal from "../modals/DeleteModal";
import {
  addButtonStyle,
  modalCancelButtonStyle,
  modalConfirmButtonStyle,
  updateButtonStyle,
  userFontSemibold,
  deleteButtonStyle,
  createUserButton,
} from "../../utils/stylingUtils";
import { useUsers } from "../hooks/useUsers";
import type { ActionType } from "../../utils/utils";
import UserDetails from "../overviews/UserDetails";
import UsersList from "../lists/UsersList";
import { useEntityActions } from "../hooks/useEntityActions";
import BuyProduct from "../forms/BuyProductMenu";
import { useOrders } from "../hooks/useOrders";
import OrderDetails from "../overviews/OrderDetails";
import LoadingSkeleton from "../reusables/LoadingSkeleton";

export default function UsersPanel() {
  const modalRef = useRef<ModalHandle>(null);

  const { users, loading, error, fetchUsers, deleteUser, userDetails, fetchUserDetails } = useUsers();
  const { orderDetails, fetchOrderDetails } = useOrders();

  const {
    action,
    selectedEntity: selectedUser,
    viewDetails,
    handleAction,
    viewEntityDetails,
    selectedNestedEntity,
    viewNestedDetails,
    viewNestedEntityDetails,
    resetActions,
    resetNestedView
  } = useEntityActions<UserData, OrderData, ReceiptData, ProductData, TraderData>();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetails(selectedUser.id)
    }
  }, [selectedUser, fetchUserDetails])

  useEffect(() => {
    if (selectedNestedEntity) {
      fetchOrderDetails(selectedNestedEntity.id)
    }
  }, [fetchOrderDetails, selectedNestedEntity])

  const handleDeleteClick = (user: UserData) => {
    handleAction("delete", user);
    modalRef.current?.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const result = await deleteUser(selectedUser.id);
    modalRef.current?.close();

    if (result.success) {
      resetActions();
    }
  };

  const renderContent = () => {
    if (action === "create") {
      return <CreateUserForm onSuccess={fetchUsers} />;
    }

    if (selectedUser) {
      switch (action) {
        case "deposit":
          return (
            <DepositMoneyForm
              user={selectedUser!}
              onSuccess={fetchUsers}
              handleBackToList={resetActions}
            />
          );

        case "update":
          return (
            <UpdateUserForm
              onSuccess={fetchUsers}
              user={selectedUser!}
              handleActionClick={(actionType: ActionType, user: UserData) =>
                handleAction(actionType, user)
              }
              handleBackToList={resetActions}
            />
          );

        case "shop":
          return (
            <BuyProduct
              trader={selectedUser}
            />
          )

        default:
          if (viewNestedDetails && selectedNestedEntity) {
            if (!orderDetails) {
              return <LoadingSkeleton />;
            }
            return <OrderDetails entity={orderDetails} />
          }

          if (viewDetails && userDetails) {
            return <UserDetails entity={userDetails} onEntityClick={viewNestedEntityDetails} />;
          }
          return null;
      }
    }
  };

  if (action || viewDetails) {
    return (
      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
        <Modal
          ref={modalRef}
          onConfirm={handleDeleteConfirm}
          confirmClassName={modalConfirmButtonStyle}
          cancelClassName={modalCancelButtonStyle + " text-purple-300"}
        >
          <h2 className="text-2xl font-bold text-purple-400 mb-4">
            Confirm Deletion
          </h2>
          <p className="text-gray-300">
            Are you sure you want to delete{" "}
            <span className={userFontSemibold}>
              {selectedUser?.name} {selectedUser?.surname}
            </span>
            ?
          </p>
          <p className="text-sm text-gray-400 mt-2">ID: {selectedUser?.id}</p>
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
              className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-purple-300 font-semibold rounded border-2 border-gray-600 transition-all"
            >
              ← Back to {viewNestedDetails ? "User" : "Users"}
            </button>
          </div>
          {action === null && selectedUser && !selectedNestedEntity && (
            <div className="flex gap-2 my-4 justify-end">
              <button
                onClick={() => handleAction("deposit", selectedUser!)}
                className={addButtonStyle + " mb-4"}
                title="Deposit"
              >
                <Plus size={18} /> Deposit
              </button>
              <button
                onClick={() => handleAction("update", selectedUser!)}
                className={updateButtonStyle + " mb-4"}
                title="Update"
              >
                <Edit size={18} /> Update
              </button>
              <button
                onClick={() => handleDeleteClick(selectedUser!)}
                className={deleteButtonStyle + " mb-4"}
                title="Delete"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          )}
        </div>
        {renderContent()}
        {action === null && selectedUser && (
          <div className="flex gap-2 my-4 justify-end">
            <button
              onClick={() => handleAction("shop", selectedUser!)}
              className={createUserButton + " mb-4"}
            >
              <ShoppingBag size={18} />
              Shop
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Modal
        ref={modalRef}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmClassName={modalConfirmButtonStyle}
        cancelClassName={modalCancelButtonStyle + " text-purple-300"}
      >
        <h2 className="text-2xl font-bold text-purple-400 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-purple-300">
            {selectedUser?.name} {selectedUser?.surname}
          </span>
          ?
        </p>
        <p className="text-sm text-gray-400 mt-2">ID: {selectedUser?.id}</p>
        <p className="text-sm text-red-400 mt-4">
          This action cannot be undone.
        </p>
      </Modal>
      <UsersList
        entities={users}
        loading={loading}
        error={error}
        onCreateClick={() => handleAction("create")}
        onEntityClick={viewEntityDetails}
        onDepositClick={(user: UserData) => handleAction("deposit", user)}
        onUpdateClick={(user: UserData) => handleAction("update", user)}
        onDeleteClick={handleDeleteClick}
      />
    </div>
  );
}
