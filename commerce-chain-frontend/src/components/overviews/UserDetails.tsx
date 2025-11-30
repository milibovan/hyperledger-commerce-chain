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
          Orders ({user["orders-ids"]?.length || 0})
        </h4>
        {user["orders-ids"]?.length > 0 ? (
          <div className="space-y-2">
            {user["orders-ids"].map((orderId) => (
              <div
                key={orderId}
                className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-purple-400 hover:shadow-lg hover:shadow-purple-400/50 hover:bg-gray-600"

              >
                <div className="flex-1">
                  {/* TODO When fetched products */}
                  {/* <h5 className={receiptFontSemibold}>{product.name}</h5> */}
                  {/* <p className="text-xs text-gray-400">ID: {product["product-id"]}</p> */}
                  <h5 className={userFontSemibold}>ID: {orderId}</h5>
                </div>
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
