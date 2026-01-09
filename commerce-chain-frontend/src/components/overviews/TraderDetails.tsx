import type { ProductData, ReceiptData, RequestDetails, TraderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import RequestCard from "../reusables/RequestCard";

export default function TraderDetails({
  entity: trader,
  addProduct,
  onProductClick,
  onEntityClick
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
              className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded border border-pink-400 hover:shadow-lg hover:shadow-pink-400/50 hover:bg-gray-600 cursor-pointer"
            >
              <div className="flex-1">
                <h5 className="font-bold text-pink-300">
                  Products sold: {trader["receipts-products"].length}
                </h5>
                <p className="text-xs text-gray-400">Buyer id: {receipt["user-id"]}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-pink-300">Total cost: ${receipt["total-cost"]}</p>
                <p className="text-xs text-gray-400">
                  Order placed: {new Date(receipt.date).toLocaleDateString()}
                </p>
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
            <div className="flex items-center gap-2 mt-2">
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
            />
          )}
        />
      </div>
    </div>
  );
}