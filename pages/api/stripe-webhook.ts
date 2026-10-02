// pages/api/stripe-webhook.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

export const config = {
  api: { bodyParser: false },
};

function buffer(req: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    req.on("data", (chunk: any) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.source !== "melocoton_ecommerce") {
        console.log("ℹ️ Sesión ignorada por source:", session.id);
        return res.json({ received: true });
      }

      if (session.payment_status !== "paid") {
        console.log(
          "ℹ️ Sesión todavía no pagada:",
          session.id,
          session.payment_status,
        );

        return res.json({ received: true });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 100,
          expand: ["data.price.product"],
        },
      );

      console.log(
        "🧾 Line items ecommerce:",
        lineItems.data.map((item) => {
          const product =
            typeof item.price?.product === "object" &&
            item.price.product !== null &&
            !("deleted" in item.price.product)
              ? item.price.product
              : null;

          return {
            description: item.description,
            quantity: item.quantity,
            amount_total: item.amount_total,
            product: product
              ? {
                  id: product.id,
                  metadata: product.metadata,
                }
              : item.price?.product,
          };
        }),
      );

      const items = lineItems.data
        .map((item) => {
          const product =
            typeof item.price?.product === "object" &&
            item.price.product !== null &&
            !("deleted" in item.price.product)
              ? item.price.product
              : null;

          const slug = product?.metadata?.slug?.trim();
          const quantity = item.quantity ?? 0;

          if (!slug || !Number.isInteger(quantity) || quantity <= 0) {
            return null;
          }

          return {
            slug,
            quantity,
          };
        })
        .filter(
          (
            item,
          ): item is {
            slug: string;
            quantity: number;
          } => item !== null,
        );

      if (items.length === 0) {
        throw new Error(
          `La sesión ${session.id} no contiene productos ecommerce válidos`,
        );
      }

      console.log("📦 Productos ecommerce:", items);

      const customerDetails = session.customer_details;
      const shippingDetails = session.collected_information?.shipping_details;

      const address = shippingDetails?.address;

      const shippingAmountCents = lineItems.data.reduce((total, item) => {
        const product =
          typeof item.price?.product === "object" &&
          item.price.product !== null &&
          !("deleted" in item.price.product)
            ? item.price.product
            : null;

        const slug = product?.metadata?.slug?.trim();

        if (slug) {
          return total;
        }

        if (item.description === "Costo de envío") {
          return total + (item.amount_subtotal ?? 0);
        }

        return total;
      }, 0);

      const sessionSubtotalCents = session.amount_subtotal ?? 0;

      const productSubtotalCents = Math.max(
        0,
        sessionSubtotalCents - shippingAmountCents,
      );

      const payload = {
        stripeSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null,

        customerEmail:
          session.customer_details?.email || session.customer_email || null,

        customerName: customerDetails?.name || null,
        currency: session.currency || "mxn",

        subtotal: productSubtotalCents / 100,
        shippingAmount: shippingAmountCents / 100,
        discountAmount: (session.total_details?.amount_discount ?? 0) / 100,
        total: (session.amount_total ?? 0) / 100,
        shippingName: shippingDetails?.name || customerDetails?.name || null,

        shippingAddress: address
          ? [address.line1, address.line2].filter(Boolean).join(", ")
          : null,

        shippingPostalCode: address?.postal_code || null,
        shippingCity: address?.city || null,
        shippingState: address?.state || null,
        shippingCountry: address?.country || null,

        hasCustomShipping: session.metadata?.hasCustomShipping === "true",

        shippingLabel: session.metadata?.shippingLabel || null,

        items,
      };

      const internalApiUrl = process.env.ECOMMERCE_INTERNAL_API_URL;
      const internalApiKey = process.env.INTERNAL_API_KEY;

      if (!internalApiUrl) {
        throw new Error("Falta ECOMMERCE_INTERNAL_API_URL");
      }

      if (!internalApiKey) {
        throw new Error("Falta INTERNAL_API_KEY");
      }

      const internalResponse = await fetch(internalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": internalApiKey,
        },
        body: JSON.stringify(payload),
      });

      const internalResult = await internalResponse.json();

      if (!internalResponse.ok) {
        console.error(
          "❌ Error procesando orden ecommerce:",
          session.id,
          internalResponse.status,
          internalResult,
        );

        throw new Error(
          `Error interno procesando orden ${session.id}: ${internalResponse.status}`,
        );
      }

      console.log(
        "✅ Orden ecommerce procesada:",
        session.id,
        internalResult.orderId,
        internalResult.alreadyProcessed === true
          ? "already_processed"
          : "created",
      );

      console.log("✅ Pago ecommerce confirmado. Session:", session.id);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error(
      "❌ Error procesando webhook ecommerce:",
      err?.message || err,
    );

    return res.status(500).json({
      received: false,
      error: "Webhook processing failed",
    });
  }
}
