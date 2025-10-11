import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import crypto from "crypto";

/**
 * Checkout seguro para Melocotón Move:
 * - Calcula precios en servidor (valida con catálogo real)
 * - Aplica cupón solo si coincide con COUPON_CODE
 * - Idempotente, evita sesiones duplicadas
 * - Redirige a success o home (ya no existe /cart)
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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: null });

const CATALOG_URL =
  process.env.API_PRODUCTS_URL ||
  process.env.NEXT_PUBLIC_API_PRODUCTS_URL ||
  "https://ily1a9bb17.execute-api.us-east-1.amazonaws.com/api/products";

const ALLOWED_ORIGINS = new Set<string>([
  "https://www.melocotonmove.com",
  "https://melocotonmove.com",
]);
const SITE_URL = "https://www.melocotonmove.com";

let _cacheData: { ts: number; map: Map<string, CatalogItem> } | null = null;
const CACHE_MS = 60_000;

async function fetchJson(url: string) {
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function getCatalogMap(): Promise<Map<string, CatalogItem>> {
  const now = Date.now();
  if (_cacheData && now - _cacheData.ts < CACHE_MS) return _cacheData.map;

  const list = (await fetchJson(CATALOG_URL)) as any[];
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
    if (item.slug && item.fullPrice > 0) map.set(item.slug, item);
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

    let baseUrl = SITE_URL;
    const hdrOrigin = (req.headers.origin as string | undefined) || "";
    if (ALLOWED_ORIGINS.has(hdrOrigin)) baseUrl = hdrOrigin;

    // ✅ Acepta ambas variantes: coupon o couponCode
    const { items, coupon, couponCode } =
      (req.body as {
        items: CartItem[];
        coupon?: string;
        couponCode?: string;
      }) || {};
    const codeInput = (coupon || couponCode || "").toUpperCase();

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "Carrito vacío" });
    }

    // Cargar catálogo real
    const catalog = await getCatalogMap();

    // Validar y construir line_items desde servidor
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

    // ✅ Validación del cupón (sin mínimo)
    const codeOK =
      codeInput && codeInput === (process.env.COUPON_CODE || "").toUpperCase();

    const discounts:
      | Stripe.Checkout.SessionCreateParams.Discount[]
      | undefined =
      codeOK && process.env.STRIPE_COUPON_ID
        ? [{ coupon: process.env.STRIPE_COUPON_ID! }]
        : undefined;

    // Idempotencia
    const idemSeed = JSON.stringify({ items, codeInput });
    const idempotencyKey =
      "checkout_" +
      crypto.createHash("sha256").update(idemSeed).digest("hex").slice(0, 32);

    // Crear sesión Stripe
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        shipping_address_collection: { allowed_countries: ["MX"] },
        allow_promotion_codes: discounts ? undefined : true,
        phone_number_collection: { enabled: true },
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/`,
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
