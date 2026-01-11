import type { OrderDetails, RequestDetails, UserDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import RequestCard from "../reusables/RequestCard";
import { ShoppingBag, Hash, DollarSign, Calendar, Package } from "lucide-react";

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
              className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-purple-400 hover:shadow-xl hover:shadow-purple-400/50 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 hover:scale-[1.01]"
            >
              {/* Decorative accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>

              <div className="p-4">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-900/30">
                      <ShoppingBag size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <h5 className="font-bold text-base text-purple-300">
                        {order.products.length} {order.products.length === 1 ? 'Product' : 'Products'} Bought
                      </h5>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Hash size={12} />
                        {order.order.id}
                      </div>
                    </div>
                  </div>

                  {/* Order Badge */}
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-purple-900/40 border-purple-500/50 text-purple-300 uppercase tracking-wide">
                    Completed
                  </span>
                </div>

                {/* Details Section */}
                <div className="flex items-center justify-between gap-4">
                  {/* Total Cost */}
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Total Cost</p>
                      <p className="font-bold text-lg text-purple-300">
                        ${order.order["total-cost"].toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Order Placed</p>
                      <p className="text-sm font-medium text-gray-300">
                        {new Date(order.receipts[0].date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional: Products count highlight */}
                <div className="mt-3 p-2 bg-purple-900/20 border border-purple-500/30 rounded flex items-center gap-2">
                  <Package size={14} className="text-purple-400" />
                  <span className="text-xs text-purple-300">
                    {order.products.length} item{order.products.length !== 1 ? 's' : ''} in this order
                  </span>
                </div>
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
          renderItem={(request: RequestDetails) => (
            <RequestCard
              request={request.request}
              onClick={() => onEntityClick?.(request.request)}
              colorScheme="purple"
            />
          )}
        />
      </div>
    </div>
  );
}
