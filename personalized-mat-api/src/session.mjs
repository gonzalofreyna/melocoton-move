import Stripe from "stripe";
import { getStripeSecret } from "./stripe-secret.mjs";
import { validatePaidSession } from "./webhook.mjs";

const respond = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(data),
});

export async function getCheckoutSession(event, env = process.env, dependencies = {}) {
  const id = event?.queryStringParameters?.session_id;
  if (typeof id !== "string" || !/^cs_(test|live)_[a-zA-Z0-9]+$/.test(id) || id.length > 255) {
    return respond(400, { ok: false, message: "Sesión inválida" });
  }
  try {
    const stripe = dependencies.stripe || new Stripe(await getStripeSecret(env));
    const session = await stripe.checkout.sessions.retrieve(id, { expand: ["payment_intent"] });
    if (session.livemode !== id.startsWith("cs_live_")) {
      return respond(404, { ok: false, message: "Sesión no encontrada" });
    }
    const paid = validatePaidSession(session);
    if (!paid) return respond(404, { ok: false, message: "Pago no confirmado" });
    let receiptUrl = null;
    const chargeId = session.payment_intent && typeof session.payment_intent !== "string" ? session.payment_intent.latest_charge : null;
    if (typeof chargeId === "string") {
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url || null;
    }
    return respond(200, {
      ok: true,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || null,
      quantity: paid.quantity,
      promotion: paid.promotion,
      sessionId: session.id,
      stripeReceiptUrl: receiptUrl,
      shippingPolicy: session.metadata?.shippingPolicy === "free" ? "free" : "quoted_separately",
    });
  } catch (error) {
    if (error?.type === "StripeInvalidRequestError" && error?.statusCode === 404) {
      return respond(404, { ok: false, message: "Sesión no encontrada" });
    }
    console.error("Error al consultar sesión personalizada", error?.message);
    return respond(503, { ok: false, message: "No fue posible confirmar el pago" });
  }
}
