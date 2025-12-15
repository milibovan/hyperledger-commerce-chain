import type { ProductData, ReceiptData, TraderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import ProductCard from "../reusables/ProductCard";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";
import NestedEntityListSection from "../reusables/NestedEntityListSection";

export default function TraderDetails({
  entity: trader,
  addProduct,
  onProductClick,
  onEntityClick
}: DetailsProps<TraderDetails>) {
  const getProductQuantity = (productId: string) => {
    return trader.trader["products-available"].find(productItem => productId === productItem["product-id"])?.quantity;
  };

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

      <div className="grid grid-cols-2 gap-4 text-gray-300 pb-4 border-b-2 border-pink-400">

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
      </div>
    </div>
  );
}
