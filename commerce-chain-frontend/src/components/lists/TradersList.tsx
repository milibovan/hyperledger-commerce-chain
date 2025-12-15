import type { TraderData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import EntityList from "../reusables/EntityList";

export default function TradersList(props: ListProps<TraderData>) {
  return (
    <EntityList
      entities={props.entities}
      loading={props.loading}
      error={props.error}
      colorScheme="pink"
      title="Traders"
      createButtonLabel="Create Trader"
      onCreateClick={props.onCreateClick}
      onEntityClick={props.onEntityClick}
      onDepositClick={props.onDepositClick}
      onUpdateClick={props.onUpdateClick}
      onDeleteClick={props.onDeleteClick}
      getEntityId={(trader) => trader.id}
      renderMainContent={(trader) => (
        <>
          <h4 className="font-bold text-lg text-pink-300">
            {trader.name}
          </h4>
          <p className="text-sm text-gray-400">
            {trader["trader-type"]}
          </p>
        </>
      )}
      renderSideContent={(trader) => (
        <>
          <p className="text-sm text-gray-400">Balance</p>
          <p className="font-bold text-pink-300">
            ${trader.balance.toFixed(2)}
          </p>
        </>
      )}
    />
  );
}