import type { ReactNode } from "react";
import type { TraderData, ProductData, UserData, ProductsData, ReceiptData, OrderData, FieldConfig, BalanceItem, Tab, RequestData, RequestDetails, TraderDetails } from "./dataTypesUtils";
import type { ColorScheme } from "./stylingUtils";

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
  addProduct?: (trader: TraderData, products?: ProductsData | ProductData[]) => void;
  onProductClick?: (product: ProductData) => void;
  onEntityClick?: (entity: UserData | TraderData | ReceiptData | OrderData | RequestData | RequestDetails) => void;
  onUnassignedClick?: (trader: TraderDetails) => void;
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
  trader: TraderData | UserData;
  selectedProducts: Map<string, number>;
  totalCost: number;
  remainingBalance: number;
  products?: ProductData[];
}



export interface ProductsTabsProps {
  user: UserData;
  products: ProductData[];
  loading: boolean;
  onSuccess: (() => Promise<void>) | undefined;
  selectedProducts: Map<string, number>;
  hasInsufficientFunds: boolean;
  errors: Map<string, string>;
  toggleProduct: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  totalCost: number,
  remainingBalance: number
}

export interface InfoSectionProps {
    title: string;
    id: string;
    entity: UserData | TraderData;
    label: string;
    value: string;
    onEntityClick: (entity: UserData | TraderData) => void;
}

export interface ProductCardProps {
    product: ProductData;
    quantity: number | undefined;
    onClick?: () => void;
    colorScheme?: "green" | "pink" | "indigo" | "amber";
}

export type EntityDetailsDisplayProps = {
  title: string;
  titleColor: string;
  labelColor: string;
  fields: FieldConfig[];
  columns?: 1 | 2;
  hasBorder?: boolean;
  borderColor?: string;
};

export type EntityListSectionProps<T = ProductData | ReceiptData | OrderData | RequestData> = {
  title: string;
  items: T[];
  colorScheme: 'purple' | 'pink' | 'green' | 'cyan' | 'indigo' | 'amber';
  icon?: 'package' | 'receipt' | 'custom' | 'request';
  customIcon?: ReactNode;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  hasBorder?: boolean;
  borderPosition?: 'top' | 'bottom' | 'right' | 'left' | 'y';
  className?: string;
  headerContent?: React.ReactNode
};

export type EntityListProps<T> = {
  entities: T[];
  loading: boolean;
  error: string | null;
  colorScheme: ColorScheme;
  title: string;
  createButtonLabel: string;
  loadingMessage?: string;
  emptyMessage?: string;
  onCreateClick: () => void;
  onEntityClick: (entity: T) => void;
  onDepositClick?: (entity: T) => void;
  onUpdateClick: (entity: T) => void;
  onDeleteClick: (entity: T) => void;
  renderMainContent: (entity: T) => ReactNode;
  renderSideContent: (entity: T) => ReactNode;
  getEntityId: (entity: T) => string | number;
};

export interface BalanceSummaryProps {
    items: BalanceItem[];
    errorMessage?: string;
    showError?: boolean;
}

export interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export interface RequestCardProps {
    request: RequestData;
    onClick?: () => void;
    colorScheme?: "pink" | "purple" | "amber";
}