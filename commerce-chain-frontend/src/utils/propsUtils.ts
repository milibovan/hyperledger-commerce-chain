import type { TraderData, ProductData, UserData } from "./dataTypesUtils";

export interface ListProps<T> {
  entities: T[];
  loading: boolean;
  error: string | null;
  onCreateClick: () => void;
  onEntityClick: (trader: T) => void;
  onDepositClick: (trader: T) => void;
  onUpdateClick: (trader: T) => void;
  onDeleteClick: (trader: T) => void;
}

export interface TraderDetailsProps {
    trader: TraderData;
    products: ProductData[];
    productsLoading: boolean;
}

export interface DetailsProps<T> {
    entity: T;
}

export interface CreateFormsProps {
  onSuccess?: () => void;
}

export interface UpdateUserFormsProps {
  onSuccess?: () => void;
  user: UserData;
  handleActionClick: (
    action: "create" | "deposit" | "update" | null,
    user: UserData
  ) => void;
  handleBackToList: () => void;
}

export interface UpdateTraderFormsProps {
  onSuccess?: () => void;
  trader: TraderData;
  handleActionClick: (
    action: "create" | "deposit" | "update" | null,
    trader: TraderData
  ) => void;
  handleBackToList: () => void;
}

export interface UpdateProductFormsProps {
  onSuccess?: () => void;
  product: ProductData;
  handleActionClick: (
    action: "create" | "increase_quantity" | "update" | null,
    product: ProductData
  ) => void;
  handleBackToList: () => void;
}