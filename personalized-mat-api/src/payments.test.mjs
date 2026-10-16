import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckoutParameters, checkoutConfiguration, createCheckout } from "./payments.mjs";

test("5x4: Stripe collects four units, metadata preserves five mats", () => {
  const p = buildCheckoutParameters({ quantity: 5, promotion: "fiveFour" }, "https://www.melocotonmove.com");
  assert.equal(p.line_items[0].quantity, 4);
  assert.equal(p.line_items[0].price_data.unit_amount, 149900);
  assert.equal(p.metadata.quantity, "5");
  assert.equal(p.metadata.promotion, "fiveFour");
  assert.equal(p.payment_method_options, undefined);
  assert.equal(p.metadata.shippingPolicy, "quoted_separately");
});

test("5%: Stripe total matches backend quote and enables available card MSI", () => {
  const p = buildCheckoutParameters({ quantity: 5, promotion: "msi5" }, "https://www.melocotonmove.com");
  assert.equal(p.line_items[0].quantity * p.line_items[0].price_data.unit_amount, 712025);
  assert.equal(p.payment_method_options.card.installments.enabled, true);
});

test("Stripe cannot accept client-provided amounts", () => {
  assert.throws(() => buildCheckoutParameters({ quantity: 5, promotion: "fiveFour", total: 1 }, "https://www.melocotonmove.com"));
});

test("Stripe checkout disabled until explicit deployment configuration", async () => {
  assert.equal(checkoutConfiguration({}), null);
  const result = await createCheckout({ body: JSON.stringify({ quantity: 5, promotion: "fiveFour" }) }, {});
  assert.equal(result.statusCode, 503);
});
