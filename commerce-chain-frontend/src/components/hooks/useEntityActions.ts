import { useState } from "react";
import type { ActionType } from "../../utils/utils";

export function useEntityActions<T, P = unknown>() {
  const [action, setAction] = useState<ActionType>(null);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [viewDetails, setViewDetails] = useState(false);

  const [selectedNestedEntity, setSelectedNestedEntity] = useState<P | null>(null);
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

  const viewNestedEntityDetails = (nestedEntity: P) => {
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
