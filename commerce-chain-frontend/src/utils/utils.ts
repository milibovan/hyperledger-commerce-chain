import type { ProductInventory } from "./dataTypesUtils";

export const host = "http://localhost:7070";
export const headers = { "Content-Type": "application/json" };
export enum httpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

// TODO Move to dataTypes
export type ActionType = "create" | "update" | "deposit" | "delete" | "addProduct" | "shop" | "showUnassigned" | "updateRequest" | null;

export async function addProductsToTrader(productsToAdd: Array<ProductInventory>, traderId: string) {
  return await fetch(`${host}/traders-products/channel-a`, {
    method: httpMethod.POST,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      products: productsToAdd,
      "trader-id": traderId,
    }),
  });
}

export async function createProduct(channel: string, traderType: string, expiryDate: string, quantity: string, price: string, name: string) {
  return await fetch(
    `${host}/product/${channel}`,
    {
      method: httpMethod.POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "trader-type": traderType,
        "expiry-date": expiryDate.replace("T", " "),
        quantity: parseInt(quantity),
        price: parseFloat(price),
        name: name,
      }),
    }
  );
}

export async function createUser(channel: string, name: string, surname: string, email: string, balance: string) {
  return await fetch(
    `${host}/user/${channel}`,
    {
      method: httpMethod.POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        surname: surname,
        email: email,
        balance: parseFloat(balance),
      }),
    }
  );
}

export async function createTrader(channel: string, name: string, traderType:string, vat: string, email: string, balance: string) {
  return await fetch(
    `${host}/trader/${channel}`,
    {
      method: httpMethod.POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        "trader-type": traderType,
        vat: vat,
        email: email,
        balance: parseFloat(balance),
        channel: channel,
      }),
    }
  );
}