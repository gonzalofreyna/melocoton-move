// pages/success.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect } from "react";
import { useCart } from "../context/CartContext";

type Item = {
  description: string | null;
  quantity: number;
  amountSubtotal: number; // en centavos
};

type SuccessProps = {
  ok: boolean;
  amountTotal?: number; // en centavos
  currency?: string;
  customerEmail?: string | null;
  items?: Item[];
  shippingCost?: number | null; // en centavos
  shippingName?: string | null;
  shippingAddress?: string | null;
  errorMessage?: string;
};

export default function SuccessPage({
  ok,
  amountTotal,
  currency,
  customerEmail,
  items,
  shippingCost,
  shippingName,
  shippingAddress,
  errorMessage,
}: SuccessProps) {
  const { clearCart } = useCart();

  // Limpia carrito al entrar a la página de éxito
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const fmt = (amountCents?: number, curr?: string) => {
    if (amountCents == null || !curr) return "-";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: curr.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amountCents / 100);
  };

  return (
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <Head>
        <title>Pago exitoso</title>
      </Head>
      <h1 className="text-3xl font-bold text-brand-blue mb-4">
        ¡Pago exitoso!
      </h1>

      {!ok ? (
        <div className="max-w-xl text-center text-red-600">
          <p className="mb-4">No pudimos obtener los detalles del pago.</p>
          {errorMessage && (
            <p className="text-sm text-gray-600">{errorMessage}</p>
          )}
          <a
            className="mt-6 inline-block bg-brand-blue text-white py-3 px-6 rounded-xl"
            href="/"
          >
            Volver al inicio
          </a>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6">
          {customerEmail && (
            <p className="text-gray-700">
              <span className="font-semibold">Correo del cliente:</span>{" "}
              {customerEmail}
            </p>
          )}

          {(shippingName || shippingAddress) && (
            <>
              <h2 className="text-xl font-semibold text-brand-blue mt-6 mb-2">
                Envío
              </h2>
              {shippingName && <p className="text-gray-700">{shippingName}</p>}
              {shippingAddress && (
                <p className="text-gray-700 whitespace-pre-line">
                  {shippingAddress}
                </p>
              )}
            </>
          )}

          <h2 className="text-xl font-semibold text-brand-blue mt-6 mb-2">
            Resumen
          </h2>
          <ul className="divide-y">
            {(items || []).map((it, idx) => (
              <li key={idx} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    {it.description || "Artículo"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cantidad: {it.quantity}
                  </p>
                </div>
                <div className="text-right text-gray-800">
                  <p className="font-semibold">
                    {fmt(it.amountSubtotal, currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t pt-4 text-right space-y-1">
            {typeof shippingCost === "number" && (
              <p className="text-sm text-gray-600">
                Envío: {fmt(shippingCost, currency)}
              </p>
            )}
            <p className="text-lg font-bold text-brand-blue">
              Total pagado: {fmt(amountTotal, currency)}
            </p>
          </div>

          <a
            className="mt-6 inline-block bg-brand-blue text-white py-3 px-6 rounded-xl"
            href="/"
          >
            Volver al inicio
          </a>
        </div>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<SuccessProps> = async (
  ctx
) => {
  try {
    const sessionId = (ctx.query.session_id as string) || null;
    if (!sessionId)
      return {
        props: { ok: false, errorMessage: "Falta session_id en la URL." },
      };

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });

    // Items comprados
    const lineItems = (session.line_items?.data || []).map((li) => ({
      description: li.description || (li.price?.product && "Artículo"),
      quantity: li.quantity || 0,
      amountSubtotal: li.amount_subtotal ?? li.amount_total ?? 0,
    }));

    // ---- FIX TS: shipping_details puede no estar en los tipos
    // Leemos de session.shipping_details con cast, o caemos a payment_intent.shipping
    const sessAny = session as any;
    const sd =
      sessAny?.shipping_details ||
      (typeof session.payment_intent === "object"
        ? (session.payment_intent as any)?.shipping
        : null);

    const addr = sd?.address;
    const shippingName: string | null = sd?.name ?? null;
    const shippingAddress: string | null = addr
      ? [
          addr.line1,
          addr.line2,
          `${addr.postal_code || ""} ${addr.city || ""}`.trim(),
          addr.state,
          addr.country,
        ]
          .filter(Boolean)
          .join("\n")
      : null;

    return {
      props: {
        ok: true,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? "mxn",
        customerEmail: session.customer_details?.email ?? null,
        items: lineItems,
        shippingCost: session.shipping_cost?.amount_total ?? null, // en centavos
        shippingName,
        shippingAddress,
      },
    };
  } catch (e: any) {
    console.error("Error en success getServerSideProps:", e);
    return {
      props: {
        ok: false,
        errorMessage: e?.message || "Error obteniendo la sesión.",
      },
    };
  }
};
