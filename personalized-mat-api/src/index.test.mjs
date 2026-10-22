import test from "node:test";
import assert from "node:assert/strict";
import { handler, validateQuote } from "./index.mjs";
const quote = (quantity, promotion) => validateQuote({ quantity, promotion });
test("10% on 1–4 mats, no installments", () => {
  for (const n of [1,2,3,4]) {
    const q = quote(n,"single10");
    assert.equal(q.unitPriceCents,139900);
    assert.equal(q.totalCents,n*125910);
    assert.equal(q.installmentsAllowed,false);
    assert.equal(q.shippingIncluded,false);
  }
});
test("15% with installments and 20% without, 5+ mats", () => {
  for (const n of [5,6,7,9,10,15,99]) {
    assert.equal(quote(n,"msi15").totalCents,n*118915);
    assert.equal(quote(n,"msi15").installmentsAllowed,true);
    assert.equal(quote(n,"volume20").totalCents,n*111920);
    assert.equal(quote(n,"volume20").installmentsAllowed,false);
  }
});
test("invalid combinations and client amounts rejected", () => {
  assert.throws(()=>quote(4,"msi15"));
  assert.throws(()=>quote(4,"volume20"));
  assert.throws(()=>quote(5,"single10"));
  assert.throws(()=>quote(0,"single10"));
  assert.throws(()=>quote(5,"fiveFour"));
  assert.throws(()=>quote(5,"msi5"));
  assert.throws(()=>validateQuote({ quantity: 5,promotion:"msi15",total:1 }));
});
test("quote endpoint returns server price", async () => {
  const r=await handler({rawPath:"/quote",requestContext:{http:{method:"POST"}},body:JSON.stringify({quantity:5,promotion:"msi15"})});
  assert.equal(r.statusCode,200);
  assert.equal(JSON.parse(r.body).quote.totalCents,594575);
});
