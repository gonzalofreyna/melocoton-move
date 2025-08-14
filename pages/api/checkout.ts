// pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

type Item = {
  name: string;
  image: string;
  price: number; // MXN
  quantity: number;
};

const SHIPPING_THRESHOLD_MXN = 1000;
const SHIPPING_FEE_MXN = 300;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error("Missing STRIPE_SECRET_KEY in environment");
      return res
        .status(500)
        .json({ ok: false, message: "Falta STRIPE_SECRET_KEY en el entorno" });
    }

    // ✅ apiVersion válida (o quítala)
    const stripe = new Stripe(secretKey); // sin apiVersion

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://main.d15wjbc4ifk2rq.amplifyapp.com";
    const originHeader = req.headers.origin as string | undefined;
    const origin = originHeader || siteUrl;

    const { items, discountPercent = 0 } = req.body as {
      items: Item[];
      discountPercent?: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "No hay items" });
    }

    const safeItems = items.map((p) => ({
      name: String(p.name || "").slice(0, 200),
      image: String(p.image || ""),
      price: Math.max(0, Number(p.price) || 0),
      quantity: Math.max(1, Math.floor(Number(p.quantity) || 1)),
    }));

    const toAbsoluteImage = (img: string) =>
      img?.startsWith("http://") || img?.startsWith("https://")
        ? img
        : `${origin}${img?.startsWith("/") ? "" : "/"}${img || ""}`;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      safeItems.map((p) => ({
        quantity: p.quantity,
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(p.price * 100),
          product_data: {
            name: p.name,
            images: p.image ? [toAbsoluteImage(p.image)] : [],
          },
        },
      }));

    const productsTotalMXN = safeItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const discountedForShippingMXN =
      productsTotalMXN * (1 - Math.max(0, discountPercent) / 100);

    const shippingAmountCents =
      discountedForShippingMXN >= SHIPPING_THRESHOLD_MXN
        ? 0
        : SHIPPING_FEE_MXN * 100;

    const hasStripeCoupon = Boolean(process.env.STRIPE_COUPON_ID);
    const shouldApplyDiscount = discountPercent > 0 && hasStripeCoupon;
    const discounts = shouldApplyDiscount
      ? [{ coupon: process.env.STRIPE_COUPON_ID! }]
      : undefined;

    const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
      [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name:
              shippingAmountCents === 0
                ? "Envío estándar (GRATIS)"
                : "Envío estándar",
            fixed_amount: { amount: shippingAmountCents, currency: "mxn" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: shouldApplyDiscount ? undefined : true,
      shipping_address_collection: { allowed_countries: ["MX"] },
      phone_number_collection: { enabled: true },
      shipping_options,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_creation: "always",
      metadata: {
        source: "web",
        discountPercent: String(discountPercent || 0),
        freeShipping: String(shippingAmountCents === 0),
      },
      discounts,
    });

    return res.status(200).json({ ok: true, id: session.id, url: session.url });
  } catch (e: any) {
    console.error("Stripe checkout error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Error" });
  }
}
