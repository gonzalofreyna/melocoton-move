// pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import crypto from "crypto";

/**
 * Este handler:
 * - Lee el catálogo desde S3 (server-side).
 * - Calcula precios en el servidor (ignora montos del cliente).
 * - Bloquea open-redirect (whitelist de dominios).
 * - Usa idempotencia para evitar sesiones/pedidos duplicados.
 * - Aplica cupón SOLO si el backend lo decide.
 * - Captura dirección de envío SIN cobrar costo de envío (sin shipping_options).
 */

type CatalogItem = {
  slug: string;
  name: string;
  image?: string;
  fullPrice: number;
  discountPrice?: number;
  freeShipping?: boolean;
  maxQty?: number;
};

type CartItem = { slug: string; quantity: number };

const DEFAULT_MAX_QTY = 10;

// ⚠️ Si tu TS marcaba error por la versión de Stripe, usa `apiVersion: null`.
// Si ya actualizaste tu cuenta a la última, pon: { apiVersion: "2025-07-30.basil" }.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: null,
});

// URL del catálogo (S3 o CloudFront). Puedes hardcodear aquí, o usar env var.
const CATALOG_URL =
  process.env.PRODUCT_CATALOG_URL ||
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/products.json";

// Dominios permitidos para success/cancel (NO usar req.headers.origin a ciegas).
const ALLOWED_ORIGINS = new Set<string>([
  "https://www.melocotonmove.com",
  "https://melocotonmove.com",
  // agrega tu preview solo si lo necesitas:
  // "https://main.d15wjbc4ifk2rq.amplifyapp.com",
]);
const SITE_URL = "https://www.melocotonmove.com";

// Cache en memoria para el catálogo (reduce fetch a S3)
let _cacheData: { ts: number; map: Map<string, CatalogItem> } | null = null;
const CACHE_MS = 60_000; // 60s

async function getCatalogMap(): Promise<Map<string, CatalogItem>> {
  const now = Date.now();
  if (_cacheData && now - _cacheData.ts < CACHE_MS) return _cacheData.map;

  const resp = await fetch(CATALOG_URL, { cache: "no-store" });
  if (!resp.ok) throw new Error(`No pude leer catálogo: ${resp.status}`);
  const list = (await resp.json()) as any[];

  const map = new Map<string, CatalogItem>();
  for (const raw of list) {
    const item: CatalogItem = {
      slug: String(raw.slug),
      name: String(raw.name ?? raw.slug),
      image: raw.image ? String(raw.image) : undefined,
      fullPrice: Number(raw.fullPrice ?? 0),
      discountPrice:
        raw.discountPrice != null ? Number(raw.discountPrice) : undefined,
      freeShipping: Boolean(raw.freeShipping),
      maxQty: Number.isFinite(raw.maxQty) ? Number(raw.maxQty) : undefined,
    };
    if (item.slug && item.fullPrice > 0) {
      map.set(item.slug, item);
    }
  }

  _cacheData = { ts: now, map };
  return map;
}

function unitAmountCents(p: CatalogItem): number {
  const price =
    p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.fullPrice;
  return Math.round(price * 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ ok: false, message: "Method not allowed" });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ ok: false, message: "Falta STRIPE_SECRET_KEY" });
    }

    // BaseURL segura (whitelist)
    let baseUrl = SITE_URL;
    const hdrOrigin = (req.headers.origin as string | undefined) || "";
    if (ALLOWED_ORIGINS.has(hdrOrigin)) baseUrl = hdrOrigin;

    // Body esperado: { items: [{slug, quantity}], couponCode?: string }
    const { items, couponCode } =
      (req.body as { items: CartItem[]; couponCode?: string }) || {};
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ ok: false, message: "Carrito vacío" });

    // Cargar catálogo (server-truth)
    const catalog = await getCatalogMap();

    // Construir line_items desde catálogo (NO confiar en precios del cliente)
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const it of items) {
      const ref = catalog.get(String(it.slug));
      if (!ref) {
        return res
          .status(400)
          .json({ ok: false, message: `Producto inválido: ${it.slug}` });
      }
      const maxQty = ref.maxQty ?? DEFAULT_MAX_QTY;
      const qty = Math.max(
        1,
        Math.min(maxQty, Math.floor(Number(it.quantity) || 1))
      );

      line_items.push({
        quantity: qty,
        // Si luego migras a Stripe Price IDs, usa { price: "price_xxx" } aquí.
        price_data: {
          currency: "mxn",
          unit_amount: unitAmountCents(ref),
          product_data: {
            name: ref.name,
            images: ref.image ? [ref.image] : [],
          },
        },
      });
    }

    // Total para reglas de cupón (en centavos)
    const totalAmount = line_items.reduce((sum, li) => {
      const unit = li.price_data!.unit_amount!;
      const qty = li.quantity || 1;
      return sum + unit * qty;
    }, 0);

    // Regla de cupón controlada en backend:
    // - Si envías `couponCode` desde cliente, compáralo con COUPON_CODE (env).
    // - Además puedes exigir total mínimo (ej: >= $1500 MXN).
    const codeOK =
      couponCode &&
      couponCode.toUpperCase() ===
        (process.env.COUPON_CODE || "").toUpperCase();

    const minOK = totalAmount >= 150000; // $1500 MXN

    const discounts:
      | Stripe.Checkout.SessionCreateParams.Discount[]
      | undefined =
      codeOK && minOK && process.env.STRIPE_COUPON_ID
        ? [{ coupon: process.env.STRIPE_COUPON_ID! }]
        : undefined;

    // Idempotencia (hash del carrito + timestamp)
    const idemSeed = JSON.stringify({ items, couponCode });
    const idempotencyKey =
      "checkout_" +
      crypto
        .createHash("sha256")
        .update(idemSeed + Date.now())
        .digest("hex")
        .slice(0, 32);

    // Crear sesión (sin shipping_options → no se cobra envío)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,

        // ✅ Capturamos dirección de envío sin costo extra
        shipping_address_collection: { allowed_countries: ["MX"] },

        // Si NO envías `discounts`, queda true y Stripe permite Promotion Codes en la UI.
        allow_promotion_codes: discounts ? undefined : true,

        phone_number_collection: { enabled: true },
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cart`,
        customer_creation: "always",
        metadata: {
          source: "web",
        },
        payment_method_options: { card: { installments: { enabled: true } } },
        discounts,
      },
      { idempotencyKey }
    );

    return res.status(200).json({ ok: true, id: session.id, url: session.url });
  } catch (e: any) {
    console.error("checkout error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Error" });
  }
}
