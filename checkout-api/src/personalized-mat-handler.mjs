import { quotePersonalizedMats, PERSONALIZED_MAT_UNIT_PRICE_MXN } from "./personalized-mat-pricing.mjs";

/**
 * A separate endpoint for personalized mats; deliberately FAIL-CLOSED until
 * the design storage, shipping quotation, webhook order registration, and
 * receipt email pipeline are implemented and verified.
 *
 * Routing/deployment is not wired yet. Do not expose this as a live payment
 * endpoint until the entire lifecycle is connected and tested.
 */
export async function handlePersonalizedMatCheckout(event) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const respond = (statusCode, data) => ({
    statusCode, headers, body: JSON.stringify(data),
  });

  // No secrets, Stripe sessions or charges created in this incomplete phase.
  if (process.env.PERSONALIZED_MAT_CHECKOUT_READY !== "true") {
    return respond(503, {
      ok: false,
      code: "PERSONALIZED_CHECKOUT_NOT_READY",
      message: "El pago de mats personalizados todavía no está disponible.",
    });
  }

  // This flag alone cannot enable payments: persistence and payment handling
  // must be implemented explicitly before wiring a payment endpoint.
  return respond(503, {
    ok: false,
    code: "PERSONALIZED_CHECKOUT_PENDING_INTEGRATION",
    message: "La compra personalizada requiere validación de diseño, envío y pedido.",
  });
}

export function validatePersonalizedMatQuote(body, unitPriceFromServer) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new TypeError("Solicitud inválida.");
  }
  const forbidden = ["price", "unitPrice", "discount", "discountAmount", "total", "subtotal", "coupon", "installments", "shippingCost"];
  if (forbidden.some((key) => Object.prototype.hasOwnProperty.call(body, key))) {
    throw new TypeError("La cotización no acepta importes ni descuentos enviados por el cliente.");
  }
  return quotePersonalizedMats({
    quantity: body.quantity,
    promotion: body.promotion,
  }, unitPriceFromServer);
}

/**
 * Server-authoritative quote endpoint, intentionally separate from payments.
 * Unit price is fixed in the private backend pricing module, not sent by FE.
 * Does not read or store logos; do not mistake this quote for an order.
 */
export async function handlePersonalizedMatQuote(event) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const response = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  let body;
  try {
    if (typeof event?.body !== "string" || event.body.length > 8192) {
      return response(400, { ok: false, message: "Solicitud inválida o demasiado grande." });
    }
    body = JSON.parse(event.body);
    const allowed = new Set(["quantity", "promotion"]);
    if (Object.keys(body).some((key) => !allowed.has(key))) {
      return response(400, { ok: false, message: "La solicitud contiene parámetros no autorizados." });
    }
    const serverPrice = PERSONALIZED_MAT_UNIT_PRICE_MXN;
    const quote = validatePersonalizedMatQuote(body, serverPrice);
    return response(200, { ok: true, quote });
  } catch (err) {
    if (err instanceof RangeError || err instanceof TypeError || err instanceof SyntaxError) {
      return response(400, { ok: false, message: "Cantidad o promoción inválida." });
    }
    return response(503, { ok: false, message: "Cotización temporalmente no disponible." });
  }
}
