export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  price: string;
  quantity: string;
  traderType: string;
  channel: string;
}

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  balance: string;
  channel: string;
}

export interface Trader {
  id: string;
  name: string;
  traderType: string;
  vat: string;
  balance: string;
  channel: string;
}

export const TraderType = [
  "SUPERMARKET",
  "CARDEALER",
  "PHARMACY",
  "GROCERY",
  "GAS_STATION",
];

export const channels = ["channel-a", "channel-b"];

export interface UsersData {
  Users: Array<UserData>;
}

export interface UserData {
  "doc-type": string;
  id: string;
  name: string;
  surname: string;
  email: string;
  "receipts-ids": Array<string>;
  balance: number;
}

export interface ProductsData {
  Products: Array<ProductData>;
}

export interface ProductData {
  "doc-type": string;
  id: string;
  name: string;
  "expiry-date": Date;
  price: number;
  quantity: number;
  "trader-type": string;
}
export interface TradersData {
  Traders: Array<TraderData>;
}

export interface TraderData {
  "doc-type": string;
  id: string;
  name: string;
  "trader-type": string;
  vat: string;
  "products-available-ids": Array<string>;
  "receipts-ids": Array<string>;
  balance: number;
}

export interface ReceiptsData {
  Receipts: Array<ReceiptData>;
}

export interface ReceiptData {
  "doc-type": string;
  id: string;
  "trader-id": string;
  "user-id": string;
  "products-ids": Array<string>;
  date: Date;
}

export interface Deposit {
  amount: string;
  channel: string;
}

export function formatDate(date: string) {
   const dateTime = new Date(date);
  
  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const day = String(dateTime.getDate()).padStart(2, '0');
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

}