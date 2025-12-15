import type { UserData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import EntityList from "../reusables/EntityList";


export default function UsersList(props: ListProps<UserData>) {
  return (
    <EntityList
      entities={props.entities}
      loading={props.loading}
      error={props.error}
      colorScheme="purple"
      title="Users"
      createButtonLabel="Create User"
      onCreateClick={props.onCreateClick}
      onEntityClick={props.onEntityClick}
      onDepositClick={props.onDepositClick}
      onUpdateClick={props.onUpdateClick}
      onDeleteClick={props.onDeleteClick}
      getEntityId={(user) => user.id}
      renderMainContent={(user) => (
        <>
          <h4 className="font-bold text-lg text-purple-300">
            {user.name} {user.surname}
          </h4>
          <p className="text-sm text-gray-400">{user.email}</p>
        </>
      )}
      renderSideContent={(user) => (
        <>
          <p className="text-sm text-gray-400">Balance</p>
          <p className="font-bold text-purple-300">
            ${user.balance.toFixed(2)}
          </p>
        </>
      )}
    />
  );
}