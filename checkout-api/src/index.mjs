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
      const { items, coupon, couponCode, shipping } = body;
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

      const SITE_URL = process.env.SITE_URL || "https://www.melocotonmove.com";
      const SHIPPING_API_URL = (process.env.SHIPPING_API_URL || "").replace(
        /\/$/,
        "",
      );
      const DEFAULT_MAX_QTY = 10;

      // --- Cargar catálogo real ---
      const products = await getCatalog();
      const catalogMap = new Map(products.map((p) => [p.slug, p]));

      // --- Construir line_items y subtotal ---
      const line_items = [];
      let subtotal = 0;

      let allItemsFreeShipping = true;

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

        if (ref.freeShipping !== true) {
          allItemsFreeShipping = false;
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

      const qualifiesForFreeShipping =
        allItemsFreeShipping &&
        subtotal >= FREE_SHIPPING_MIN_TOTAL &&
        !hasCustomShipping;

      let shippingCost = 0;
      let shippingLabel = "";
      let actualShippingCost = 0;

      let selectedShippingProvider = "";
      let selectedShippingService = "";
      let selectedShippingServiceCode = "";

      let shippingPromoApplied = false;

      if (hasCustomShipping) {
        shippingCost = 0;

        shippingLabel = "Incluye artículos con envío a cotizar 🚛";
      } else {
        if (!SHIPPING_API_URL) {
          throw new Error("Falta SHIPPING_API_URL en checkout-api");
        }

        const postalCode = String(shipping?.postalCode || "").trim();

        const areaLevel1 = String(shipping?.areaLevel1 || "").trim();

        const areaLevel2 = String(shipping?.areaLevel2 || "").trim();

        const areaLevel3 = String(shipping?.areaLevel3 || "").trim();

        if (!/^\d{5}$/.test(postalCode)) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ok: false,
              message: "Código postal de envío inválido.",
            }),
          };
        }

        if (!areaLevel1 || !areaLevel2 || !areaLevel3) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ok: false,
              message: "Faltan datos del destino de envío.",
            }),
          };
        }

        const shippingPromoCode = String(shipping?.shippingPromoCode || "")
          .trim()
          .toUpperCase();

        const quoteResponse = await fetch(
          `${SHIPPING_API_URL}/api/shipping/quote`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              postalCode,
              areaLevel1,
              areaLevel2,
              areaLevel3,

              promoCode: shippingPromoCode || undefined,

              items,
            }),
          },
        );

        const quoteData = await quoteResponse.json().catch(() => null);

        if (!quoteResponse.ok || !quoteData?.ok) {
          console.error("❌ Shipping quote error:", quoteData);

          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ok: false,

              message:
                quoteData?.detail ||
                quoteData?.error ||
                quoteData?.message ||
                "No fue posible validar el envío.",
            }),
          };
        }

        // Código manual de envío gratis
        if (quoteData.type === "free_shipping_promo") {
          shippingCost = 0;

          shippingPromoApplied = true;

          shippingLabel = "Envío gratis por código promocional 🚚✨";
        } else {
          const rates = Array.isArray(quoteData.rates) ? quoteData.rates : [];

          if (rates.length === 0) {
            return {
              statusCode: 400,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ok: false,
                message:
                  "No encontramos tarifas disponibles para este destino.",
              }),
            };
          }

          /*
           * Promoción normal de envío gratis:
           * checkout vuelve a cotizar y Melocotón
           * absorbe la tarifa más económica.
           */
          if (qualifiesForFreeShipping) {
            const cheapestRate = rates[0];

            selectedShippingProvider = cheapestRate.provider || "";

            selectedShippingService = cheapestRate.serviceName || "";

            selectedShippingServiceCode = cheapestRate.serviceCode || "";

            actualShippingCost = Number(cheapestRate.total) || 0;
            shippingCost = 0;

            shippingLabel = "Envío gratis";
          } else {
            const requestedProvider = String(
              shipping?.selectedProvider || "",
            ).trim();

            const requestedServiceCode = String(
              shipping?.selectedServiceCode || "",
            ).trim();

            const selectedRate = rates.find(
              (rate) =>
                rate.provider === requestedProvider &&
                rate.serviceCode === requestedServiceCode,
            );

            if (!selectedRate) {
              return {
                statusCode: 409,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ok: false,
                  message:
                    "La tarifa seleccionada ya no está disponible. Vuelve a cotizar el envío.",
                }),
              };
            }

            const realShippingCost = Number(selectedRate.total);

            if (!Number.isFinite(realShippingCost) || realShippingCost < 0) {
              throw new Error("Skydropx devolvió un costo de envío inválido.");
            }

            /*
             * Comprobamos además que el precio no haya
             * cambiado desde que el cliente cotizó.
             */
            const expectedShippingTotal = Number(
              shipping?.expectedShippingTotal,
            );

            if (!Number.isFinite(expectedShippingTotal)) {
              return {
                statusCode: 400,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ok: false,
                  message:
                    "Falta la tarifa de envío seleccionada. Vuelve a cotizar el envío.",
                }),
              };
            }

            if (Math.abs(expectedShippingTotal - realShippingCost) > 0.01) {
              return {
                statusCode: 409,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ok: false,
                  message:
                    "La tarifa de envío cambió. Vuelve a cotizar antes de continuar.",
                }),
              };
            }

            shippingCost = realShippingCost;
            actualShippingCost = realShippingCost;

            selectedShippingProvider = selectedRate.provider || "";

            selectedShippingService = selectedRate.serviceName || "";

            selectedShippingServiceCode = selectedRate.serviceCode || "";

            shippingLabel =
              `${selectedRate.providerDisplayName} · ` +
              `${selectedRate.serviceName} · ` +
              `$${shippingCost.toFixed(2)}`;
          }
        }
      }

      if (shippingCost > 0) {
        line_items.push({
          quantity: 1,

          price_data: {
            currency: "mxn",

            unit_amount: Math.round(shippingCost * 100),

            product_data: {
              name: "Costo de envío",
              images: [],
            },
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

          shippingProvider: selectedShippingProvider,

          shippingService: selectedShippingService,

          shippingServiceCode: selectedShippingServiceCode,

          shippingCost: String(shippingCost),
          actualShippingCost: String(actualShippingCost),
          freeShipping: qualifiesForFreeShipping ? "true" : "false",

          shippingPromoApplied: shippingPromoApplied ? "true" : "false",
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
