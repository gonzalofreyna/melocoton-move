import test from "node:test";
import assert from "node:assert/strict";
import { handler, validateQuote } from "./index.mjs";

test("5x4 uses server fixed price and excludes installments", () => {
  const result = validateQuote({ quantity: 5, promotion: "fiveFour" });
  assert.equal(result.totalCents, 599600);
  assert.equal(result.installmentsAllowed, false);
  assert.equal(result.shippingIncluded, false);
});

test("5 percent applies to original price", () => {
  const result = validateQuote({ quantity: 5, promotion: "msi5" });
  assert.equal(result.totalCents, 712025);
  assert.equal(result.installmentsAllowed, true);
});

test("reject client amounts, missing promotions and invalid quantities", () => {
  assert.throws(() => validateQuote({ quantity: 5, promotion: "fiveFour", total: 1 }));
  assert.throws(() => validateQuote({ quantity: 0, promotion: "fiveFour" }));
  assert.throws(() => validateQuote({ quantity: 3, promotion: "other" }));
});

test("quote endpoint returns authoritative totals", async () => {
  const r = await handler({ rawPath: "/quote", requestContext: { http: { method: "POST" } }, body: JSON.stringify({ quantity: 5, promotion: "fiveFour" }) });
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse(r.body).quote.totalCents, 599600);
});

test("checkout always fails closed until registration is integrated", async () => {
  const r = await handler({ rawPath: "/checkout", requestContext: { http: { method: "POST" } }, body: "{}" });
  assert.equal(r.statusCode, 503);
});


test("20% applies to every unit from five onwards, not just complete packs", () => {
  for (const quantity of [5, 6, 7, 9, 10, 15]) {
    const quote = validateQuote({ quantity, promotion: "volume20" });
    assert.equal(quote.totalCents, quantity * 119920);
    assert.equal(quote.discountCents, quantity * 29980);
    assert.equal(quote.freeUnits, 0);
    assert.equal(quote.installmentsAllowed, false);
  }
  assert.throws(() => validateQuote({ quantity: 4, promotion: "volume20" }));
});
