import { getFormattedDate, type ReceiptData } from "../../utils/dataTypesUtils";
import type { ListProps } from "../../utils/propsUtils";
import EntityList from "../reusables/EntityList";


export default function ReceiptsList(props: ListProps<ReceiptData>) {
    return (
        <EntityList
            entities={props.entities}
            loading={props.loading}
            error={props.error}
            colorScheme="green"
            title="Receipts"
            createButtonLabel="Create Receipt"
            onCreateClick={props.onCreateClick}
            onEntityClick={props.onEntityClick}
            onUpdateClick={props.onUpdateClick}
            onDeleteClick={props.onDeleteClick}
            getEntityId={(receipt) => receipt.id}
            renderMainContent={(receipt) => (
                <>
                    <p className="text-gray-400">Between</p>
                    <h4 className="font-bold text-lg text-green-300">
                        {receipt["user-id"]}
                    </h4>
                    <p className="text-gray-400">and</p>
                    <h4 className="font-bold text-lg text-green-300">
                        {receipt["trader-id"]}
                    </h4>
                    <p className="text-sm text-gray-400">
                        {getFormattedDate(receipt.date)}
                    </p>
                </>
            )}
            renderSideContent={(receipt) => (
                <>
                    <p className="text-sm text-gray-400">Products no:</p>
                    <p className="font-bold text-green-300">
                        {receipt.products.length}
                    </p>
                </>
            )}
        />
    );
}