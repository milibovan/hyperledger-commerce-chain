import { useState } from "react";
import type { ActionType } from "../../utils/utils";
import type { OrderData, ProductData, ReceiptData, RequestData, TraderData, UserData } from "../../utils/dataTypesUtils";

export function useEntityActions<T, O = OrderData, R = TraderData, U = UserData, P = ProductData, C = ReceiptData, Q = RequestData>() {
  const [action, setAction] = useState<ActionType>(null);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [viewDetails, setViewDetails] = useState(false);

  const [selectedNestedEntity, setSelectedNestedEntity] = useState<O | R | U | T | P | C | Q | null>(null);
  const [viewNestedDetails, setViewNestedDetails] = useState(false);

  const handleAction = (actionType: ActionType, entity?: T) => {
    setAction(actionType);
    if (entity) {
      setSelectedEntity(entity);
    }
    if (actionType !== null) {
      setViewDetails(false);
      setViewNestedDetails(false);
    }
  };

  const viewEntityDetails = (entity: T) => {
    setSelectedEntity(entity);
    setViewDetails(true);
    setAction(null);
    setViewNestedDetails(false);
  };

  const viewNestedEntityDetails = (nestedEntity: O | R | U | T | P | C | Q ) => {
    setSelectedNestedEntity(nestedEntity);
    setViewNestedDetails(true);
  };

  const resetActions = () => {
    setAction(null);
    setSelectedEntity(null);
    setViewDetails(false);
    setViewNestedDetails(false);
  }

  const resetNestedView = () => {
    setSelectedNestedEntity(null);
    setViewNestedDetails(false);
  };

  return {
    action,
    selectedEntity,
    viewDetails,
    selectedNestedEntity,
    viewNestedDetails,
    handleAction,
    viewEntityDetails,
    viewNestedEntityDetails,
    resetActions,
    resetNestedView,
  };
}
