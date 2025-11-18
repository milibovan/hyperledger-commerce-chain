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

export interface DetailsProps<T> {
    entity: T;
    date?: string;
    products?: ProductData[];
    productsLoading?: boolean;
    addProduct?: (trader: TraderData, products?: ProductData[]) => void;
    onProductClick?: (product: ProductData) => void;
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

export interface DepositMoneyProps {
  user: UserData | TraderData;
  onSuccess?: () => void;
  handleBackToList: () => void;
}

export interface IncreaseQuantityProps {
  product: ProductData;
  onSuccess?: () => void;
  handleBackToList: () => void;
}

export interface AddOrBuyProductProps<T> {
  trader: T;
  tradersProducts?: ProductData[];
  onSuccess?: () => Promise<void>;
}

export interface ModalProps {
  trader: TraderData;
  selectedProducts: Map<string, number>;
  totalCost: number;
  remainingBalance: number;
  products?: ProductData[];
}

export interface ProductsTabsProps {
  user: UserData;
  products: ProductData[];
  loading: boolean;
  onSuccess: (() => Promise<void>) | undefined
}