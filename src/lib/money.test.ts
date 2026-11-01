import assert from "node:assert/strict";
import { discountedLine, invoiceTotals, sumLines } from "./money.ts";

const priced = discountedLine(2, 1000, 10);
assert.equal(priced.gross, 2000);
assert.equal(priced.discount, 200);
assert.equal(priced.net, 1800);

const totals = invoiceTotals([
  { quantity: 1, unitAmount: 5000, discountRate: 20 },
  { quantity: 2, unitAmount: 100, discountRate: 0 },
]);
assert.equal(totals.subtotal, 5200);
assert.equal(totals.discount, 1000);
assert.equal(totals.total, 4200);
assert.equal(sumLines([{ quantity: 1, unitAmount: 80 }]), 80);
assert.equal(discountedLine(1, 100, 150).rate, 100);

console.log("invoice totals ok");
