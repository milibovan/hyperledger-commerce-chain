import type { ProductData, ReceiptData, RequestDetails, TraderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import RequestCard from "../reusables/RequestCard";
import { Receipt, User, DollarSign, Calendar, Package } from "lucide-react";

export default function TraderDetails({
  entity: trader,
  addProduct,
  onProductClick,
  onEntityClick,
  onUnassignedClick
}: DetailsProps<TraderDetails>) {
  const getProductQuantity = (productId: string) => {
    return trader.trader["products-available"].find(productItem => productId === productItem["product-id"])?.quantity;
  };

  let requestCount = 0;
  let hasRequests = false;

  if (trader["available-requests"]) {
    requestCount = trader["available-requests"].length;
    hasRequests = requestCount > 0;
  }

  return (
    <div className="space-y-6">
      <EntityDetailsDisplay
        title="Trader Details"
        titleColor="text-pink-400"
        labelColor="text-pink-300"
        hasBorder={true}
        borderColor="border-pink-400"
        fields={[
          { label: 'ID', value: trader.trader.id },
          { label: 'VAT', value: trader.trader.vat },
          { label: 'Name', value: trader.trader.name },
          { label: 'Email', value: trader.trader.email },
          {
            label: 'Balance',
            value: trader.trader.balance,
            formatter: (val) => `$${val.toFixed(2)}`
          },
          {
            label: 'Type',
            value: trader.trader['trader-type'].toUpperCase()
          },
        ]}
      />

      <div className="grid grid-cols-3 gap-4 text-gray-300 pb-4 border-b-2 border-pink-400">

        {/* Products Section */}
        <NestedEntityListSection
          title="Products"
          items={trader["available-products"] || []}
          colorScheme="pink"
          icon="package"
          hasBorder={true}
          borderPosition="right"
          actionButton={{
            label: "Add products",
            onClick: () => addProduct!(trader.trader!, trader["available-products"]!),
          }}
          renderItem={(product: ProductData) => (
            <ProductCard
              product={product}
              quantity={getProductQuantity(product.id)}
              onClick={() => onProductClick?.(product)}
              colorScheme="pink"
            />
          )}
        />

        {/* Receipts Section */}
        <NestedEntityListSection
          title="Receipts"
          items={trader.receipts || []}
          colorScheme="pink"
          icon="receipt"
          hasBorder={true}
          borderPosition="right"
          emptyMessage="No receipts"
          renderItem={(receipt: ReceiptData) => (
            <div
              onClick={() => onEntityClick?.(receipt)}
              className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 border-pink-400 hover:shadow-xl hover:shadow-pink-400/50 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 hover:scale-[1.01]"
            >
              {/* Decorative accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-400"></div>

              <div className="p-4">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-900/30">
                      <Receipt size={20} className="text-pink-300" />
                    </div>
                    <div>
                      <h5 className="font-bold text-base text-pink-300">
                        {trader["receipts-products"].length} {trader["receipts-products"].length === 1 ? 'Product' : 'Products'} Sold
                      </h5>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User size={12} />
                        Buyer ID: {receipt["user-id"]}
                      </div>
                    </div>
                  </div>

                  {/* Receipt Badge */}
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-pink-900/40 border-pink-500/50 text-pink-300 uppercase tracking-wide">
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
                      <p className="font-bold text-lg text-pink-300">
                        ${receipt["total-cost"].toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Order Placed</p>
                      <p className="text-sm font-medium text-gray-300">
                        {new Date(receipt.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optional: Products count highlight */}
                <div className="mt-3 p-2 bg-pink-900/20 border border-pink-500/30 rounded flex items-center gap-2">
                  <Package size={14} className="text-pink-400" />
                  <span className="text-xs text-pink-300">
                    {trader["receipts-products"].length} item{trader["receipts-products"].length !== 1 ? 's' : ''} in this receipt
                  </span>
                </div>
              </div>
            </div>
          )}
        />

        {/* Requests Section with Available Requests Badge */}
        <NestedEntityListSection
          title="Requests"
          items={trader.requests || []}
          colorScheme="pink"
          icon="request"
          emptyMessage="No requests"
          headerContent={
            <div className="flex items-center gap-2 mt-2" onClick={() => onUnassignedClick!(trader)}>
              <div className={`
                relative flex items-center gap-2 px-3 py-1.5 rounded-full 
                border-2 transition-all duration-300
                ${hasRequests
                  ? "bg-pink-500/20 border-pink-500 hover:bg-pink-500/30 cursor-pointer"
                  : "bg-gray-700/50 border-gray-600 cursor-default"
                }
              `}>
                <div className="relative">
                  <span className={`font-bold text-sm ${hasRequests ? "text-pink-300" : "text-gray-500"}`}>
                    {requestCount}
                  </span>
                  {hasRequests && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${hasRequests ? "text-pink-300" : "text-gray-500"}`}>
                  {hasRequests ? "Unassigned" : "No new requests"}
                </span>
              </div>
            </div>
          }
          renderItem={(request: RequestDetails) => (
            <RequestCard
              request={request.request}
              onClick={() => onEntityClick?.(request.request)}
              colorScheme="pink"
              trader={trader}
            />
          )}
        />
      </div>
    </div>
  );
}