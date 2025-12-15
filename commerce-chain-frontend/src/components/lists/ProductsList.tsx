import type { ProductData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import { getFormattedDate } from "../../utils/dataTypesUtils";
import EntityList from "../reusables/EntityList";


export default function ProductsList(props: ListProps<ProductData>) {
  return (
    <EntityList
      entities={props.entities}
      loading={props.loading}
      error={props.error}
      colorScheme="cyan"
      title="Products"
      createButtonLabel="Create Product"
      onCreateClick={props.onCreateClick}
      onEntityClick={props.onEntityClick}
      onDepositClick={props.onDepositClick}
      onUpdateClick={props.onUpdateClick}
      onDeleteClick={props.onDeleteClick}
      getEntityId={(product) => product.id}
      renderMainContent={(product) => (
        <>
          <h4 className="font-bold text-lg text-cyan-300">
            {product.name}
          </h4>
          <p className="text-sm text-gray-400">
            {getFormattedDate(product["expiry-date"])}
          </p>
        </>
      )}
      renderSideContent={(product) => (
        <>
          <p className="text-sm text-gray-400">Price</p>
          <p className="font-bold text-cyan-300">
            ${product.price.toFixed(2)}
          </p>
        </>
      )}
    />
  );
}
