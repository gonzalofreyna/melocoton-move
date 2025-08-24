import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import crypto from "crypto";

/**
 * - Lee catálogo desde S3 (server-truth).
 * - Calcula precios en el servidor (ignora montos del cliente).
 * - Whitelist de dominios para success/cancel (anti open-redirect).
 * - Idempotencia para evitar sesiones duplicadas.
 * - Aplica cupón SOLO si (couponCode === COUPON_CODE) **sin mínimo**.
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

// Usa la versión por defecto de tu cuenta (evita conflictos de TS)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: null });

// URL del catálogo (S3/CloudFront)
const CATALOG_URL =
  process.env.PRODUCT_CATALOG_URL ||
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/products.json";

// Whitelist de orígenes permitidos
const ALLOWED_ORIGINS = new Set<string>([
  "https://www.melocotonmove.com",
  "https://melocotonmove.com",
  // "https://main.d15wjbc4ifk2rq.amplifyapp.com", // si lo necesitas
]);
const SITE_URL = "https://www.melocotonmove.com";

// Cache en memoria para el catálogo
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
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ ok: false, message: "Falta STRIPE_SECRET_KEY" });
    }

    // BaseURL segura (whitelist)
    let baseUrl = SITE_URL;
    const hdrOrigin = (req.headers.origin as string | undefined) || "";
    if (ALLOWED_ORIGINS.has(hdrOrigin)) baseUrl = hdrOrigin;

    // Body: { items: [{slug, quantity}], couponCode?: string }
    const { items, couponCode } =
      (req.body as { items: CartItem[]; couponCode?: string }) || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Carrito vacío" });
    }

    // Cargar catálogo
    const catalog = await getCatalogMap();

    // Construcción de line_items confiando SOLO en el catálogo
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
        // Si migras a Stripe Price IDs, usa { price: "price_xxx" } aquí.
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

    // Validación del cupón (texto ↔︎ COUPON_CODE), **sin mínimo**
    const codeOK =
      couponCode &&
      couponCode.toUpperCase() ===
        (process.env.COUPON_CODE || "").toUpperCase();

    const discounts:
      | Stripe.Checkout.SessionCreateParams.Discount[]
      | undefined =
      codeOK && process.env.STRIPE_COUPON_ID
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

    // Crear sesión (sin shipping_options → no hay costo de envío)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,

        // Capturar dirección de envío, sin costo
        shipping_address_collection: { allowed_countries: ["MX"] },

        // Si no se envía 'discounts', permitimos escribir Promotion Codes en la UI.
        allow_promotion_codes: discounts ? undefined : true,

        phone_number_collection: { enabled: true },
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cart`,
        customer_creation: "always",
        metadata: { source: "web" },
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
