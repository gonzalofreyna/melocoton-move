import { createCheckout } from "./payments.mjs";
import { quotePersonalizedMats, PERSONALIZED_MAT_UNIT_PRICE_MXN } from "./personalized-mat-pricing.mjs";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const corsHeaders = (event) => {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  const allowed = process.env.PERSONALIZED_MAT_SITE_ORIGIN;
  if (!origin || !allowed || origin !== allowed.replace(/\/$/, "")) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    Vary: "Origin",
  };
};
const respond = (statusCode, data) => ({ statusCode, headers, body: JSON.stringify(data) });

export function validateQuote(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new TypeError("Solicitud invalida");
  if (Object.keys(body).some((key) => !["quantity", "promotion"].includes(key))) {
    throw new TypeError("Parametros no autorizados");
  }
  return quotePersonalizedMats(body, PERSONALIZED_MAT_UNIT_PRICE_MXN);
}

export async function handler(event) {
  const path = event?.rawPath || event?.path || "";
  const method = event?.requestContext?.http?.method || event?.httpMethod || "";
  if (method === "OPTIONS") return { statusCode: 204, headers: { ...headers, ...corsHeaders(event) }, body: "" };
  if (method !== "POST") return { ...respond(405, { ok: false, message: "Metodo no permitido" }), headers: { ...headers, ...corsHeaders(event) } };
  if (!["/quote", "/checkout"].some((route) => path.endsWith(route))) {
    return respond(404, { ok: false, message: "Ruta no encontrada" });
  }
  if (path.endsWith("/checkout")) {
    const result = await createCheckout(event);
    return { ...result, headers: { ...result.headers, ...corsHeaders(event) } };
  }
  try {
    if (typeof event?.body !== "string" || event.body.length > 8192 || event.isBase64Encoded) {
      return respond(400, { ok: false, message: "Solicitud invalida" });
    }
    const quote = validateQuote(JSON.parse(event.body));
    return { ...respond(200, { ok: true, quote }), headers: { ...headers, ...corsHeaders(event) } };
  } catch (err) {
    if (err instanceof RangeError || err instanceof TypeError || err instanceof SyntaxError) {
      return respond(400, { ok: false, message: "Cantidad o promocion invalida" });
    }
    return respond(503, { ok: false, message: "Cotizacion no disponible" });
  }
}
