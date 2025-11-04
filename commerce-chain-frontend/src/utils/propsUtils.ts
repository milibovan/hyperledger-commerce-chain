import type { TraderData, ProductData, UserData } from "./dataTypesUtils";

export interface TradersListProps {
  traders: TraderData[];
  loading: boolean;
  error: string | null;
  onCreateClick: () => void;
  onTraderClick: (trader: TraderData) => void;
  onDepositClick: (trader: TraderData) => void;
  onUpdateClick: (trader: TraderData) => void;
  onDeleteClick: (trader: TraderData) => void;
}

export interface TraderDetailsProps {
    trader: TraderData;
    products: ProductData[];
    productsLoading: boolean;
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