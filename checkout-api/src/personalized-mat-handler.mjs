import { quotePersonalizedMats } from "./personalized-mat-pricing.mjs";

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
