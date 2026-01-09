import { type RequestDetails, type TraderDetails } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import NestedEntityListSection from "../reusables/NestedEntityListSection";
import RequestCard from "../reusables/RequestCard";

export default function UnassignedRequests({ entity: trader, onEntityClick }: DetailsProps<TraderDetails>) {
    return (
        <NestedEntityListSection
            title="Unassigned requests"
            items={trader["available-requests"] || []}
            colorScheme="amber"
            icon="request"
            className="pt-4"
            emptyMessage="No requests"
            renderItem={(request: RequestDetails) => (
                <RequestCard
                    request={request.request}
                    onClick={() => onEntityClick?.(request)}
                    colorScheme="amber"
                />
            )}
        />
    );
}