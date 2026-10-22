import { validateQuote } from "./index.mjs";
import { getStripeSecret } from "./stripe-secret.mjs";

const json = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(data),
});

export function checkoutConfiguration(env = process.env) {
  const required = ["PERSONALIZED_MAT_SITE_ORIGIN"];
  if (env.PERSONALIZED_MAT_CHECKOUT_READY !== "true" || required.some((key) => !env[key])) return null;
  let origin;
  try { origin = new URL(env.PERSONALIZED_MAT_SITE_ORIGIN); } catch { return null; }
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && origin.hostname === "localhost")) return null;
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
  // Production checkout must return only to the official storefront.
  if (origin.origin !== "https://www.melocotonmove.com") return null;
  return { origin: origin.origin };
}

export function buildCheckoutParameters(body, origin) {
  const quote = validateQuote(body);
  const unitAmount = quote.discountedUnitCents;
  // Stripe's line item total must equal the server quote, including odd quantities.
  const itemQuantity = quote.quantity;
  if (itemQuantity * unitAmount !== quote.totalCents) {
    throw new Error("El total calculado no coincide.");
  }
  return {
    mode: "payment",
    // Stripe selects eligible payment methods from Dashboard settings.
    payment_method_options: { card: { installments: { enabled: quote.installmentsAllowed } } },
    line_items: [
      {
        price_data: {
          currency: "mxn",
          unit_amount: unitAmount,
          product_data: {
            name: "Mat profesional personalizado — Melocotón Move",
            description: quote.promotion === "volume20" ? "20% de descuento por pago de contado desde 5 mats. Envío por cotizar." : quote.promotion === "msi15" ? "15% de descuento con opción de 3 MSI desde 5 mats. Envío por cotizar." : "10% de descuento de 1 a 4 mats. Envío por cotizar.",
          },
        },
        quantity: itemQuantity,
      },

    ],
    customer_creation: "always",
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    success_url: origin + "/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: origin + "/crea-tu-mat?cancelled=1",
    metadata: {
      source: "melocoton_personalized_mat",
      promotion: quote.promotion,
      quantity: String(quote.quantity),
      freeUnits: String(quote.freeUnits),
      priceCents: String(quote.unitPriceCents),
      pricingVersion: "v2",
      totalCents: String(quote.totalCents),
      deliveryBusinessDays: "45",
      shippingPolicy: "quoted_separately",
      designStatus: "pending_contact",
    },
    payment_intent_data: {
      metadata: { source: "melocoton_personalized_mat", promotion: quote.promotion, quantity: String(quote.quantity) },
    },
  };
}

export async function createCheckout(event, env = process.env) {
  const config = checkoutConfiguration(env);
  if (!config) return json(503, { ok: false, code: "CHECKOUT_NOT_READY", message: "El pago personalizado todavía no está disponible." });
  let params;
  try {
    if (typeof event.body !== "string" || event.body.length > 8192 || event.isBase64Encoded) throw new TypeError();
    params = buildCheckoutParameters(JSON.parse(event.body), config.origin);
  } catch (err) {
    if (err instanceof TypeError || err instanceof RangeError || err instanceof SyntaxError) return json(400, { ok: false, message: "Cantidad o promoción inválida." });
    return json(503, { ok: false, message: "No se pudo validar el importe." });
  }
  try {
    const { default: Stripe } = await import("stripe");
    const secret = await getStripeSecret(env);
    if (!secret.startsWith("sk_live_")) return json(503, { ok: false, code: "LIVE_MODE_REQUIRED", message: "Checkout de producción no configurado." });
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe no devolvió URL.");
    return json(200, { ok: true, url: session.url });
  } catch (err) {
    console.error("Error al crear checkout personalizado", err);
    return json(503, { ok: false, message: "El pago está temporalmente no disponible." });
  }
}

