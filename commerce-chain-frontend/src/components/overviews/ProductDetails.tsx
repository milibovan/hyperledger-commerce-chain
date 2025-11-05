import { getFormattedDate, type ProductData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";

export default function ProductDetails({entity: product}: DetailsProps<ProductData> ) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-cyan-400">Product Details</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-300">
        <div>
          <span className="font-semibold text-cyan-300">ID:</span>{" "}
          {product.id}
        </div>
        <div>
          <span className="font-semibold text-cyan-300">Product Name:</span>{" "}
          {product.name}
        </div>
        <div>
          <span className="font-semibold text-cyan-300">Expiry Date:</span>{" "}
          {getFormattedDate(product)}
        </div>
        <div>
          <span className="font-semibold text-cyan-300">Price:</span> $
          {product.price.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold text-cyan-300">Quantity: </span>
          {product.quantity.toFixed(0)}
        </div>
        <div>
          <span className="font-semibold text-cyan-300">Trader type: </span>
          {product["trader-type"].toUpperCase()}
        </div>
      </div>
    </div>
  );
}
