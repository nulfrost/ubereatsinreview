import { UberEatsOrder } from "./parse.server";

export function getTotalSpend(orders: UberEatsOrder[]) {
  if (!orders.at(0)?.["Order Price"]) return 0;
  return Number(
    orders
      .map((order) => Number(order["Order Price"]))
      .filter(Boolean)
      .reduce((curr, acc) => curr + acc, 0)
      .toFixed(2)
  );
}

export function getFirstOrder(orders: UberEatsOrder[]) {
  return orders
    .map((order) => order["Order Time"])
    .filter(Boolean)
    .at(-1);
}
