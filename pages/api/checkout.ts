// pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

type Item = {
  name: string;
  image: string;
  price: number;
  quantity: number;
  freeShipping?: boolean; // flag por producto
};

const SHIPPING_FEE_MXN = 300;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    // --- Diagnóstico de entorno (temporal) ---
    const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasCoupon = Boolean(process.env.STRIPE_COUPON_ID);
    console.log("HAS_STRIPE_KEY?", hasStripeKey, "HAS_COUPON?", hasCoupon);

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return res
        .status(500)
        .json({ ok: false, message: "Falta STRIPE_SECRET_KEY en el entorno" });
    }

    const stripe = new Stripe(secretKey /*, { apiVersion: "2024-06-20" } */);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://main.d15wjbc4ifk2rq.amplifyapp.com";
    const origin = (req.headers.origin as string | undefined) || siteUrl;

    const { items, discountPercent = 0 } = req.body as {
      items: Item[];
      discountPercent?: number;
    };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, message: "No hay items" });
    }

    // Normaliza
    const safeItems = items
      .map((p) => ({
        name: String(p.name || "").slice(0, 200),
        image: String(p.image || ""),
        price: Math.max(0, Number(p.price) || 0),
        quantity: Math.max(1, Math.floor(Number(p.quantity) || 1)),
        freeShipping: Boolean(p.freeShipping),
      }))
      .filter((p) => p.price > 0);

    if (safeItems.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Todos los items tienen precio inválido (0)",
      });
    }

    // Imagen absoluta para Stripe
    const toAbsoluteImage = (img: string) =>
      /^https?:\/\//.test(img)
        ? img
        : `${origin}${img?.startsWith("/") ? "" : "/"}${img || ""}`;

    // Line items
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

    // Envío: gratis solo si TODOS los items lo traen
    const allItemsFreeShipping = safeItems.every(
      (it) => it.freeShipping === true
    );
    const shippingAmountCents = allItemsFreeShipping
      ? 0
      : SHIPPING_FEE_MXN * 100;

    // Cupones
    const shouldApplyDiscount = discountPercent > 0 && hasCoupon;
    const discounts = shouldApplyDiscount
      ? [{ coupon: process.env.STRIPE_COUPON_ID! }]
      : undefined;

    // Opción de envío (única)
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

    try {
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
          freeShipping: String(allItemsFreeShipping),
          shippingAmountCents: String(shippingAmountCents),
          // útil para auditoría rápida:
          anyItemWithoutFreeShipping: String(!allItemsFreeShipping),
        },
        discounts,
        // MSI habilitado (planes gobernados por Dashboard)
        payment_method_options: {
          card: { installments: { enabled: true } },
        },
      });

      return res
        .status(200)
        .json({ ok: true, id: session.id, url: session.url });
    } catch (stripeErr: any) {
      console.error("Stripe create session error:", stripeErr);
      const msg =
        stripeErr?.raw?.message ||
        stripeErr?.message ||
        "Stripe session creation failed";
      return res.status(400).json({ ok: false, message: msg });
    }
  } catch (e: any) {
    console.error("Stripe checkout error:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Error" });
  }
}
