export interface Product {
    name: string,
    expiryDate: string,
    price: string,
    quantity: string,
    traderType: string,
    channel: string
}

export interface User {
  name: string;
  surname: string;
  email: string;
  balance: string;
  channel: string;
}

export interface Trader {
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
  "GAS_STATON",
];

export const channels = ['channel-a', 'channel-b'];