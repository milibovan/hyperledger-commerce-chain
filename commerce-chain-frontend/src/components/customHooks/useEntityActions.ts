import { useState } from "react";
import type { ActionType } from "../../utils/utils";

export function useEntityActions<T>() {
  const [action, setAction] = useState<ActionType>(null);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [viewDetails, setViewDetails] = useState(false);

  const handleAction = (actionType: ActionType, entity?: T) => {
    setAction(actionType);
    if (entity) {
      setSelectedEntity(entity);
    }
    if (actionType !== null) {
      setViewDetails(false);
    }
  };

  const viewEntityDetails = (entity: T) => {
    setSelectedEntity(entity);
    setViewDetails(true);
    setAction(null);
  };

  const resetActions = () => {
    setAction(null);
    setSelectedEntity(null);
    setViewDetails(false);
  }

  return {
    action,
    selectedEntity,
    viewDetails,
    handleAction,
    viewEntityDetails,
    resetActions,
  };
}
