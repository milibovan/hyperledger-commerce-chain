import type { OrderDetails, RequestData, UserDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import RequestCard from "../reusables/RequestCard";

export default function UserDetails({ entity: userDetails, onEntityClick }: DetailsProps<UserDetails>) {
  return (
    <div className="space-y-6">
      <EntityDetailsDisplay
        title="User Details"
        titleColor="text-purple-400"
        labelColor="text-purple-300"
        hasBorder={true}
        borderColor="border-purple-400"
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
            formatter: (val) => `$${val.toFixed(2)}`
          },
        ]}
      />
      <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-b-2 border-purple-400">

        <NestedEntityListSection
          title="Orders"
          items={userDetails.orders || []}
          colorScheme="purple"
          hasBorder={true}
          borderPosition="right"
          className="pt-4"
          emptyMessage="No orders"
          renderItem={(order: OrderDetails) => (
            <div
              onClick={() => onEntityClick?.(order.order)}
              className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-purple-400 hover:shadow-lg hover:shadow-purple-400/50 hover:bg-gray-600 cursor-pointer"
            >
              <div className="flex-1">
                <h5 className="font-bold text-purple-300">
                  Products bought: {order.products.length}
                </h5>
                <p className="text-xs text-gray-400">ID: {order.order.id}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-300">
                  Total cost: ${order.order["total-cost"]}
                </p>
                <p className="text-xs text-gray-400">
                  Order placed: {new Date(order.receipts[0].date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        />

        <NestedEntityListSection
          title="Requests"
          items={userDetails.requests || []}
          colorScheme="purple"
          icon="request"
          className="pt-4"
          emptyMessage="No requests"
          renderItem={(request: RequestData) => (
            <RequestCard
              request={request}
              onClick={() => onEntityClick?.(request)}
              colorScheme="purple"
            />
          )}
        />
      </div>
    </div>
  );
}
