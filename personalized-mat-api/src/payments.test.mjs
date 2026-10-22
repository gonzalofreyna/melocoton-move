import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckoutParameters, checkoutConfiguration, createCheckout } from "./payments.mjs";
const checkout=(quantity,promotion)=>buildCheckoutParameters({quantity,promotion},"https://www.melocotonmove.com");
test("10% from 1 to 4: correct Stripe line and no MSI",()=>{
 for(const n of [1,2,4]) {
 const p=checkout(n,"single10");
 assert.equal(p.line_items[0].quantity,n);
 assert.equal(p.line_items[0].price_data.unit_amount,125910);
 assert.equal(p.payment_method_options.card.installments.enabled,false);
 assert.equal(p.metadata.pricingVersion,"v2");
 }
});
test("15% + MSI from 5 and 20% contado: Stripe totals match quote",()=>{
 for(const n of [5,6,10,99]) {
  for(const [promo,unit,msi] of [["msi15",118915,true],["volume20",111920,false]]) {
   const p=checkout(n,promo);
   assert.equal(p.line_items[0].quantity,n);
   assert.equal(p.line_items[0].price_data.unit_amount,unit);
   assert.equal(p.line_items[0].quantity*unit,n*unit);
   assert.equal(p.payment_method_options.card.installments.enabled,msi);
   assert.equal(p.metadata.totalCents,String(n*unit));
  }
 }
});
test("reject invalid promo and client amounts",()=>{
 assert.throws(()=>checkout(4,"msi15"));
 assert.throws(()=>checkout(5,"single10"));
 assert.throws(()=>buildCheckoutParameters({quantity:5,promotion:"volume20",total:1},"https://www.melocotonmove.com"));
});
test("checkout remains disabled without live configuration",async()=>{
 assert.equal(checkoutConfiguration({}),null);
 const r=await createCheckout({body:JSON.stringify({quantity:5,promotion:"msi15"})},{});
 assert.equal(r.statusCode,503);
});
