import Stripe from "stripe";
import { priceCart, wholesaleConfig, PricingValidationError } from "./pricing.mjs";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// === Configuración AWS ===
const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION });

// === Obtener secret de Secrets Manager ===
async function getSecret(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await secrets.send(command);
  const raw = response.SecretString;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.STRIPE_SECRET_KEY) return parsed.STRIPE_SECRET_KEY;
    return raw;
  } catch {
    return raw;
  }
}

// === Cargar catálogo desde API pública ===
async function getCatalog() {
  const CATALOG_URL = process.env.API_PRODUCTS_URL;

  if (!CATALOG_URL) {
    throw new Error("Falta API_PRODUCTS_URL en la configuración de la Lambda");
  }

  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`Error al cargar catálogo: ${res.status}`);
  const data = await res.json();

  console.log("✅ Catálogo cargado:", data.length, "productos");
  return data;
}

// === Lambda Handler ===
export const handler = async (event) => {
  console.log(
    "📦 Event recibido:",
    event.rawPath,
    event.requestContext?.http?.method,
  );

  const path = event.rawPath;
  const method = event.requestContext.http.method;

  // Price preview and checkout share the same server-side calculator.
  if ((path === "/checkout" || path === "/pricing") && method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { items } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, message: "Carrito vacío" }),
        };
      }

      const products = await getCatalog();
      const priced = priceCart(items, products, wholesaleConfig());
      if (path === "/pricing") {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ok: true,
            subtotal: priced.subtotalCents / 100,
            discount: priced.discountCents / 100,
            total: priced.totalCents / 100,
            config: priced.config,
            items: priced.items.map((item) => ({
              slug: item.slug, quantity: item.quantity,
              unitPrice: item.unitCents / 100, wholesale: item.wholesale,
            })),
          }),
        };
      }

      const stripeSecretKey = await getSecret(
        process.env.SECRET_NAME || "eternancy/STRIPE_SECRET_KEY",
      );
      const stripe = new Stripe(stripeSecretKey);
      const SITE_URL = process.env.SITE_URL || "https://www.melocotonmove.com";
      const catalogMap = new Map(products.map((product) => [String(product.slug), product]));
      const line_items = priced.items.map(({ product, quantity, unitCents }) => ({
        quantity,
        price_data: {
          currency: "mxn",
          unit_amount: unitCents,
          product_data: {
            name: product.name,
            images: product.image ? [product.image] : [],
            metadata: {
              slug: String(product.slug),
              sku: product.sku ? String(product.sku) : "",
            },
          },
        },
      }));

      // Envío gratuito universal. La dirección es recopilada por Stripe Checkout.
      // Los productos de envío especial se gestionan logísticamente después del pago.
      const hasCustomShipping = items.some((it) => {
        const ref = catalogMap.get(String(it.slug));
        return ref?.shippingType === "custom";
      });
      const qualifiesForFreeShipping = true;
      const shippingCost = 0;
      const actualShippingCost = 0; // Sin cotización logística en el checkout
      const shippingLabel = "Envío gratis";
      const selectedShippingProvider = "";
      const selectedShippingService = "";
      const selectedShippingServiceCode = "";
      const shippingPromoApplied = false;

      // --- Crear sesión Stripe ---
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        shipping_address_collection: { allowed_countries: ["MX"] },
        phone_number_collection: { enabled: true },
        success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/`,
        metadata: {
          source: "melocoton_ecommerce",

          hasCustomShipping: hasCustomShipping ? "true" : "false",

          shippingLabel,

          shippingProvider: selectedShippingProvider,

          shippingService: selectedShippingService,

          shippingServiceCode: selectedShippingServiceCode,

          shippingCost: String(shippingCost),
          actualShippingCost: String(actualShippingCost),
          freeShipping: qualifiesForFreeShipping ? "true" : "false",

          shippingPromoApplied: shippingPromoApplied ? "true" : "false",
          wholesaleDiscountCents: String(priced.discountCents),
        },
        payment_method_options: { card: { installments: { enabled: process.env.STRIPE_MSI_ENABLED === "true" } } },
      });

      console.log("✅ Sesión Stripe creada:", session.id);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: true,
          id: session.id,
          url: session.url,
          shippingLabel,
          wholesaleDiscount: priced.discountCents / 100,
        }),
      };
    } catch (err) {
      console.error("❌ Checkout error:", err);
      return {
        statusCode: err instanceof PricingValidationError || err instanceof SyntaxError ? 400 : 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: err instanceof SyntaxError ? "Solicitud JSON inválida" : err.message }),
      };
    }
  }

  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
};
