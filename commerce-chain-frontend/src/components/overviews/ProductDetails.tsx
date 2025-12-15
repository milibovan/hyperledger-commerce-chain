import { getFormattedDate, type ProductData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import EntityDetailsDisplay from "../reusables/EntityDetailsDisplay";

export default function ProductDetails({ entity: product }: DetailsProps<ProductData>) {
  return (
    <div className="space-y-4">
      <EntityDetailsDisplay
        title="Product Details"
        titleColor="text-cyan-400"
        labelColor="text-cyan-300"
        fields={[
          { label: 'ID', value: product.id },
          { label: 'Product Name', value: product.name },
          {
            label: 'Expiry Date',
            // TODO Solve error
            value: product['expiry-date'],
            formatter: (val) => getFormattedDate(val)
          },
          {
            label: 'Price',
            value: product.price,
            formatter: (val) => `$${val.toFixed(2)}`
          },
          {
            label: 'Quantity',
            value: product.quantity,
            formatter: (val) => val.toFixed(0)
          },
          {
            label: 'Trader type',
            value: product['trader-type'].toUpperCase()
          },
        ]}
      />
    </div>
  );
}
