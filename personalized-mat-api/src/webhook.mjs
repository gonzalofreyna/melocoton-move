import { quotePersonalizedMats, quoteLegacyPersonalizedMats, PERSONALIZED_MAT_UNIT_PRICE_MXN } from "./personalized-mat-pricing.mjs";

const respond = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(data),
});

/**
 * Stripe remains the source of truth. This endpoint only authenticates and
 * validates events; it does not create a second order store or send messages.
 */
export function validatePaidSession(session) {
  if (session?.metadata?.source !== "melocoton_personalized_mat") return null;
  if (session.payment_status !== "paid") return null;
  if (session.mode !== "payment" || !session.id?.startsWith("cs_")) throw new Error("Invalid checkout session");
  const quoteInput = {
    quantity: Number(session.metadata.quantity),
    promotion: session.metadata.promotion,
  };
  const quote = session.metadata.pricingVersion === "v2"
    ? quotePersonalizedMats(quoteInput, PERSONALIZED_MAT_UNIT_PRICE_MXN)
    : quoteLegacyPersonalizedMats(quoteInput);
  if (
    session.currency !== "mxn" ||
    session.amount_total !== quote.totalCents ||
    session.metadata.totalCents !== String(quote.totalCents) ||
    session.metadata.priceCents !== String(quote.unitPriceCents) ||
    session.metadata.freeUnits !== String(quote.freeUnits)
  ) {
    throw new Error("Stripe session total does not match server pricing");
  }
  return { sessionId: session.id, quantity: quote.quantity, promotion: quote.promotion, totalCents: quote.totalCents };
}

export async function handleStripeWebhook(event, env = process.env, dependencies = {}) {
  const secret = env.PERSONALIZED_MAT_WEBHOOK_SECRET;
  if (!secret || !secret.startsWith("whsec_")) {
    return respond(503, { received: false, code: "WEBHOOK_NOT_CONFIGURED" });
  }
  const signature = event?.headers?.["stripe-signature"] ?? event?.headers?.["Stripe-Signature"];
  if (typeof signature !== "string" || typeof event?.body !== "string") {
    return respond(400, { received: false });
  }
  let stripeEvent;
  try {
    const stripe = dependencies.stripe ?? new (await import("stripe")).default(env.STRIPE_SECRET_KEY || "sk_test_placeholder");
    const payload = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    stripeEvent = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.warn("Personalized Stripe webhook signature verification failed");
    return respond(400, { received: false });
  }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(stripeEvent.type)) {
    return respond(200, { received: true, ignored: true });
  }
  try {
    const details = validatePaidSession(stripeEvent.data.object);
    if (!details) return respond(200, { received: true, ignored: true });
    // Do not log customer PII or accept a webhook as a second order store.
    console.info("Personalized mat payment confirmed", details);
    return respond(200, { received: true });
  } catch (err) {
    console.error("Personalized mat payment validation failed:", err?.message);
    // Explicit failure causes Stripe to retry; do not falsely acknowledge.
    return respond(500, { received: false });
  }
}
