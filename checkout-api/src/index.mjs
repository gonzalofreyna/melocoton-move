import Stripe from "stripe";
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

  // === POST /checkout ===
  if (path === "/checkout" && method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { items, coupon, couponCode } = body;
      const codeInput = (coupon || couponCode || "").toUpperCase();

      if (!Array.isArray(items) || items.length === 0) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ok: false, message: "Carrito vacío" }),
        };
      }

      // --- Configuración ---
      const stripeSecretKey = await getSecret(
        process.env.SECRET_NAME || "eternancy/STRIPE_SECRET_KEY",
      );

      const stripe = new Stripe(stripeSecretKey);
      const FREE_SHIPPING_MIN_TOTAL = Number(
        process.env.FREE_SHIPPING_MIN_TOTAL || 499,
      );
      const FIXED_SHIPPING_FEE = Number(process.env.FIXED_SHIPPING_FEE || 149);
      const SITE_URL = process.env.SITE_URL || "https://www.melocotonmove.com";
      const DEFAULT_MAX_QTY = 10;

      // --- Cargar catálogo real ---
      const products = await getCatalog();
      const catalogMap = new Map(products.map((p) => [p.slug, p]));

      // --- Construir line_items y subtotal ---
      const line_items = [];
      let subtotal = 0;

      for (const it of items) {
        const ref = catalogMap.get(String(it.slug));
        if (!ref) {
          console.error("❌ Producto no encontrado:", it.slug);
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: false,
              message: `Producto inválido o no encontrado: ${it.slug}`,
            }),
          };
        }

        const maxQty = ref.maxQty ?? DEFAULT_MAX_QTY;
        const requestedQty = Math.max(1, Math.floor(Number(it.quantity) || 1));

        const stock =
          typeof ref.stock === "number" && Number.isFinite(ref.stock)
            ? Math.max(0, Math.floor(ref.stock))
            : null;

        if (stock !== null && stock <= 0) {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: false,
              message: `Producto agotado: ${ref.name}`,
            }),
          };
        }

        const maxAllowed = stock === null ? maxQty : Math.min(maxQty, stock);

        if (requestedQty > maxAllowed) {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ok: false,
              message: `Solo puedes comprar hasta ${maxAllowed} unidad(es) de ${ref.name}`,
            }),
          };
        }

        const qty = requestedQty;
        const price =
          ref.discountPrice && ref.discountPrice > 0
            ? ref.discountPrice
            : ref.fullPrice;

        subtotal += price * qty;

        line_items.push({
          quantity: qty,
          price_data: {
            currency: "mxn",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: ref.name,
              images: ref.image ? [ref.image] : [],
              metadata: {
                slug: String(ref.slug),
                sku: ref.sku ? String(ref.sku) : "",
              },
            },
          },
        });
      }

      // --- Envío ---
      const hasCustomShipping = items.some((it) => {
        const ref = catalogMap.get(String(it.slug));
        return ref && ref.shippingType === "custom";
      });

      let shippingCost = 0;
      let shippingLabel = "Envío gratis 🚚✨";

      if (hasCustomShipping) {
        shippingCost = 0;
        shippingLabel = "Incluye artículos con envío a cotizar 🚛";
      } else if (subtotal < FREE_SHIPPING_MIN_TOTAL) {
        shippingCost = FIXED_SHIPPING_FEE;
        shippingLabel = `Costo de envío fijo $${FIXED_SHIPPING_FEE}`;
      }

      if (shippingCost > 0) {
        line_items.push({
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: Math.round(shippingCost * 100),
            product_data: { name: "Costo de envío", images: [] },
          },
        });
      }

      // --- Cupón ---
      const codeOK =
        codeInput &&
        codeInput === (process.env.COUPON_CODE || "").toUpperCase();
      const discounts =
        codeOK && process.env.STRIPE_COUPON_ID
          ? [{ coupon: process.env.STRIPE_COUPON_ID }]
          : undefined;

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
        },
        payment_method_options: { card: { installments: { enabled: true } } },
        discounts,
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
        }),
      };
    } catch (err) {
      console.error("❌ Checkout error:", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: err.message }),
      };
    }
  }

  return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
};
