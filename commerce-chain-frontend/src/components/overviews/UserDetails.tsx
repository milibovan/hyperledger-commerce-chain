import type { UserData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { userFontSemibold } from "../../utils/stylingUtils";

export default function UserDetails({ entity: user }: DetailsProps<UserData>) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-purple-400">User Details</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-300">
        <div>
          <span className={userFontSemibold}>ID:</span> {user.id}
        </div>
        <div>
          <span className={userFontSemibold}>Email:</span>{" "}
          {user.email}
        </div>
        <div>
          <span className={userFontSemibold}>Name:</span>{" "}
          {user.name} {user.surname}
        </div>
        <div>
          <span className={userFontSemibold}>Balance:</span> $
          {user.balance.toFixed(2)}
        </div>
      </div>
      <div className="pt-4 border-t-2 border-purple-400">
        <h4 className="text-xl font-bold text-purple-300 mb-2">
          Receipts ({user["receipts-ids"]?.length || 0})
        </h4>
        {user["receipts-ids"]?.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {user["receipts-ids"].map((receiptId) => (
              <div
                key={receiptId}
                className="px-3 py-2 bg-gray-700 rounded border border-purple-400 text-sm text-gray-300"
              >
                {receiptId}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-purple-400">
            No receipts
          </div>
        )}
      </div>
    </div>
  );
}
