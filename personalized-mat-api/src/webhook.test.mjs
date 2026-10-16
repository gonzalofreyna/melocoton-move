import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { handleStripeWebhook, validatePaidSession } from "./webhook.mjs";

const secret = "whsec_test_fixture_not_a_real_key";
const stripe = new Stripe("sk_test_fixture_not_a_real_key");
const paid = {
  id: "cs_test_example",
  mode: "payment",
  payment_status: "paid",
  currency: "mxn",
  amount_total: 599600,
  metadata: {
    source: "melocoton_personalized_mat",
    quantity: "5",
    promotion: "fiveFour",
    totalCents: "599600",
    priceCents: "149900",
    freeUnits: "1",
  },
};
const eventBody = (session, type = "checkout.session.completed") =>
  JSON.stringify({ id: "evt_test_example", type, data: { object: session } });
const signed = (body) => ({
  headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload: body, secret }) },
  body,
});

test("webhook disabled without signing secret", async () => {
  assert.equal((await handleStripeWebhook({}, {}, { stripe })).statusCode, 503);
});
test("webhook rejects invalid signature", async () => {
  const result = await handleStripeWebhook({ headers: { "stripe-signature": "invalid" }, body: "{}" }, { PERSONALIZED_MAT_WEBHOOK_SECRET: secret }, { stripe });
  assert.equal(result.statusCode, 400);
});
test("webhook accepts signed and correctly priced payment", async () => {
  const result = await handleStripeWebhook(signed(eventBody(paid)), { PERSONALIZED_MAT_WEBHOOK_SECRET: secret }, { stripe });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).received, true);
});
test("webhook ignores non-personalized and unpaid sessions", async () => {
  assert.equal(validatePaidSession({ ...paid, metadata: { source: "melocoton_ecommerce" } }), null);
  assert.equal(validatePaidSession({ ...paid, payment_status: "unpaid" }), null);
});
test("webhook rejects forged Stripe session totals", async () => {
  const result = await handleStripeWebhook(signed(eventBody({ ...paid, amount_total: 100 })), { PERSONALIZED_MAT_WEBHOOK_SECRET: secret }, { stripe });
  assert.equal(result.statusCode, 500);
});
test("webhook handles base64 encoded raw body", async () => {
  const body = eventBody(paid, "checkout.session.async_payment_succeeded");
  const result = await handleStripeWebhook({
    ...signed(body), body: Buffer.from(body).toString("base64"), isBase64Encoded: true,
  }, { PERSONALIZED_MAT_WEBHOOK_SECRET: secret }, { stripe });
  assert.equal(result.statusCode, 200);
});
test("unrelated signed event is acknowledged without processing", async () => {
  const result = await handleStripeWebhook(signed(eventBody(paid, "payment_intent.created")), { PERSONALIZED_MAT_WEBHOOK_SECRET: secret }, { stripe });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).ignored, true);
});
