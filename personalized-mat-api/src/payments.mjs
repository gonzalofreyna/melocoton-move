import { validateQuote } from "./index.mjs";

const json = (statusCode, data) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(data),
});

export function checkoutConfiguration(env = process.env) {
  const required = ["STRIPE_SECRET_KEY", "PERSONALIZED_MAT_WEBHOOK_SECRET", "PERSONALIZED_MAT_ORDERS_TABLE", "PERSONALIZED_MAT_SITE_ORIGIN"];
  if (env.PERSONALIZED_MAT_CHECKOUT_READY !== "true" || required.some((key) => !env[key])) return null;
  let origin;
  try { origin = new URL(env.PERSONALIZED_MAT_SITE_ORIGIN); } catch { return null; }
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && origin.hostname === "localhost")) return null;
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
  return { origin: origin.origin, table: env.PERSONALIZED_MAT_ORDERS_TABLE };
}

export function buildCheckoutParameters(body, origin) {
  const quote = validateQuote(body);
  const unitAmount = quote.promotion === "msi5"
    ? Math.round(quote.unitPriceCents * 95 / 100)
    : quote.unitPriceCents;
  // Stripe's line item total must equal the server quote, including odd quantities.
  const itemQuantity = quote.promotion === "fiveFour" ? quote.quantity - quote.freeUnits : quote.quantity;
  if (itemQuantity * unitAmount !== quote.totalCents) {
    throw new Error("El total calculado no coincide.");
  }
  return {
    mode: "payment",
    payment_method_types: ["card"],
    ...(quote.installmentsAllowed ? { payment_method_options: { card: { installments: { enabled: true } } } } : {}),
    line_items: [{
      price_data: {
        currency: "mxn",
        unit_amount: unitAmount,
        product_data: {
          name: "Mat profesional personalizado — Melocotón Move",
          description: quote.promotion === "fiveFour"
            ? "Promoción 5×4. Diseño a definir después de la compra. Envío por cotizar."
            : "5% de descuento. Diseño a definir después de la compra. Envío por cotizar.",
        },
      },
      quantity: itemQuantity,
    }],
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
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe no devolvió URL.");
    return json(200, { ok: true, url: session.url });
  } catch (err) {
    console.error("Error al crear checkout personalizado", err);
    return json(503, { ok: false, message: "El pago está temporalmente no disponible." });
  }
}

export async function processStripeWebhook(event, env = process.env) {
  if (!checkoutConfiguration(env)) return json(503, { received: false });
  const signature = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];
  if (!signature || typeof event.body !== "string") return json(400, { received: false });
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, env.PERSONALIZED_MAT_WEBHOOK_SECRET);
    if (stripeEvent.type !== "checkout.session.completed" && stripeEvent.type !== "checkout.session.async_payment_succeeded") {
      return json(200, { received: true });
    }
    const session = stripeEvent.data.object;
    if (session.metadata?.source !== "melocoton_personalized_mat" || session.payment_status !== "paid") {
      return json(200, { received: true });
    }
    const quote = validateQuote({ quantity: Number(session.metadata.quantity), promotion: session.metadata.promotion });
    if (quote.totalCents !== session.amount_total || session.currency !== "mxn") {
      throw new Error("El importe de Stripe no coincide con la cotización del servidor.");
    }
    const { DynamoDBClient, PutItemCommand } = await import("@aws-sdk/client-dynamodb");
    const db = new DynamoDBClient({});
    const contact = session.customer_details || {};
    await db.send(new PutItemCommand({
      TableName: env.PERSONALIZED_MAT_ORDERS_TABLE,
      Item: {
        stripeSessionId: { S: session.id },
        paymentStatus: { S: "paid" },
        createdAt: { S: new Date().toISOString() },
        promotion: { S: quote.promotion },
        quantity: { N: String(quote.quantity) },
        freeUnits: { N: String(quote.freeUnits) },
        amountTotalCents: { N: String(quote.totalCents) },
        currency: { S: "mxn" },
        email: { S: contact.email || session.customer_email || "unknown" },
        customerName: { S: contact.name || "" },
        customerPhone: { S: contact.phone || "" },
        paymentIntentId: { S: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || "" },
        designStatus: { S: "pending_contact" },
        shippingStatus: { S: "awaiting_quote" },
        deliveryBusinessDays: { N: "45" },
      },
      ConditionExpression: "attribute_not_exists(stripeSessionId)",
    }));
    return json(200, { received: true });
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") return json(200, { received: true, alreadyProcessed: true });
    if (err?.type === "StripeSignatureVerificationError") return json(400, { received: false });
    console.error("Error guardando pedido de mat personalizado:", err);
    return json(500, { received: false });
  }
}
