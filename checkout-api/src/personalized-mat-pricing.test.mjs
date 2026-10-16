import test from "node:test";
import assert from "node:assert/strict";
import { quotePersonalizedMats } from "./personalized-mat-pricing.mjs";
import { validatePersonalizedMatQuote, handlePersonalizedMatCheckout } from "./personalized-mat-handler.mjs";

test("5x4: five mats, four paid, no installments", () => {
  const q = quotePersonalizedMats({ quantity: 5, promotion: "fiveFour" }, 1499);
  assert.equal(q.totalCents, 599600);
  assert.equal(q.discountCents, 149900);
  assert.equal(q.installmentsAllowed, false);
  assert.equal(q.shippingIncluded, false);
  assert.equal(q.deliveryBusinessDays, 45);
});
test("5% original price and eligible installments, not accumulated with 5x4", () => {
  const q = quotePersonalizedMats({ quantity: 5, promotion: "msi5" }, 1499);
  assert.equal(q.totalCents, 712025);
  assert.equal(q.freeUnits, 0);
  assert.equal(q.installmentsAllowed, true);
});
test("reject forged amounts, promo, quantities and undefined server price", () => {
  assert.throws(() => validatePersonalizedMatQuote({ quantity: 5, promotion: "fiveFour", total: 1 }, 1499));
  assert.throws(() => quotePersonalizedMats({ quantity: 0, promotion: "fiveFour" }, 1499));
  assert.throws(() => quotePersonalizedMats({ quantity: 5, promotion: "hack" }, 1499));
  assert.throws(() => quotePersonalizedMats({ quantity: 5, promotion: "msi5" }, undefined));
});
test("checkout is fail-closed, no Stripe session", async () => {
  const result = await handlePersonalizedMatCheckout({ body: "{}" });
  assert.equal(result.statusCode, 503);
  assert.equal(JSON.parse(result.body).ok, false);
});
