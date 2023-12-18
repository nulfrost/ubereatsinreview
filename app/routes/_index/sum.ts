import { UberEatsOrder } from "./parse.server";

export function getTotalSpend(orders: UberEatsOrder[]) {
  return Number(
    orders
      .map((order) => Number(order["Order Price"]))
      .filter(Boolean)
      .reduce((curr, acc) => curr + acc)
      .toFixed(2)
  );
}

export function getFirstOrder(orders: UberEatsOrder[]) {
  return orders
    .map((order) => order["Order Time"])
    .filter(Boolean)
    .at(-1);
}
