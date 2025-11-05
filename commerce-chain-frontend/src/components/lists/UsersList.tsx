import { Plus, Edit, Trash2 } from "lucide-react";
import type { UserData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import { addButtonSm, updateButtonSm, deleteButtonSm, entitiesNotFound} from "../../utils/stylingUtils";


export default function UsersList({
  entities: users,
  loading,
  error,
  onCreateClick,
  onEntityClick: onUserClick,
  onDepositClick,
  onUpdateClick,
  onDeleteClick,
}: ListProps<UserData>) {
  return (
    <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-8 shadow-2xl shadow-purple-500/50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-purple-400">Users</h3>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-900 border-2 border-red-500 text-red-200 rounded">
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-purple-300 py-8">Loading users...</div>
      ) : users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                onUserClick(user);
              }}
              className="flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-purple-400 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/50 cursor-pointer"
            >
              <div className="flex-1">
                <h4 className="font-bold text-lg text-purple-300">
                  {user.name} {user.surname}
                </h4>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="font-bold text-purple-300">
                    ${user.balance.toFixed(2)}
                  </p>
                </div>
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onDepositClick(user)}
                    className={addButtonSm}
                    title="Deposit"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => onUpdateClick(user)}
                    className={updateButtonSm}
                    title="Update"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteClick(user)}
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
        <div className={entitiesNotFound}>No users found</div>
      )}
    </div>
  );
}
