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