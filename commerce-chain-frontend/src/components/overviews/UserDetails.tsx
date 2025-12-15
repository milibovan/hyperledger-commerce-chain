import type { UserDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { userFontBold } from "../../utils/stylingUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";

export default function UserDetails({ entity: userDetails, onEntityClick }: DetailsProps<UserDetails>) {
  return (
    <div className="space-y-4">
      <EntityDetailsDisplay
        title="User Details"
        titleColor="text-purple-400"
        labelColor="text-purple-300"
        fields={[
          { label: 'ID', value: userDetails.user.id },
          { label: 'Email', value: userDetails.user.email },
          {
            label: 'Name',
            value: `${userDetails.user.name} ${userDetails.user.surname}`
          },
          {
            label: 'Balance',
            value: userDetails.user.balance,
            // TODO Solve error
            formatter: (val) => `$${val.toFixed(2)}`
          },
        ]}
      />
      <div className="pt-4 border-t-2 border-purple-400">
        <h4 className="text-xl font-bold text-purple-300 mb-2">
          Orders ({userDetails.user["orders-ids"]?.length || 0})
        </h4>
        {userDetails.user["orders-ids"]?.length > 0 ? (
          <div className="space-y-2">
            {userDetails.orders.map((order) => (
              <div
                key={order.order.id}
                className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-purple-400 hover:shadow-lg hover:shadow-purple-400/50 hover:bg-gray-600"
                onClick={() => onEntityClick?.(order.order)}
              >
                <div className="flex-1">
                  <h5 className={userFontBold}>Products bought: {order.products.length}</h5>
                  <p className="text-xs text-gray-400">ID: {order.order.id}</p>
                </div>
                <div className="text-right">
                  <p className={userFontBold}>Total cost: ${order.order["total-cost"]}</p>
                  <p className="text-xs text-gray-400">
                    Order placed:{" "}
                    {new Date(order.receipts[0].date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4 bg-gray-700 rounded border border-purple-400">
            No orders
          </div>
        )}
      </div>
    </div>
  );
}
