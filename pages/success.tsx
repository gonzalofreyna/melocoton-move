// pages/success.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRef } from "react";
import { useRouter } from "next/router"; // ✅ navegación estable
import { useCart } from "../context/CartContext";

type Item = {
  description: string | null;
  quantity: number;
  amountSubtotal: number;
};

type SuccessProps = {
  ok: boolean;
  amountTotal?: number;
  currency?: string;
  customerEmail?: string | null;
  items?: Item[];
  shippingCost?: number | null;
  shippingName?: string | null;
  shippingAddress?: string | null;
  orderId?: string | null;
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
  orderId,
  errorMessage,
}: SuccessProps) {
  const { closeCart } = useCart(); // 👈 ya no limpiamos aquí
  const pdfRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fmt = (value?: number, curr?: string) => {
    if (value == null || !curr) return "-";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: curr.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: `Factura-MelocotonMove-${orderId || "pedido"}.pdf`,
      image: { type: "jpeg" as "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait" as "portrait",
      },
    };

    html2pdf().from(pdfRef.current).set(opt).save();
  };

  if (!ok) {
    return (
      <main className="flex flex-col items-center px-6 py-20 bg-gray-50 min-h-screen text-center">
        <Head>
          <title>Error de pago</title>
        </Head>
        <h1 className="text-3xl font-bold text-red-600 mb-3">
          No pudimos obtener los detalles del pago.
        </h1>
        {errorMessage && (
          <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
        )}
        <button
          onClick={() => router.push("/")}
          className="bg-brand-blue text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-beige hover:text-brand-blue transition"
        >
          Volver al inicio
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center px-4 py-16 bg-gray-50 min-h-screen">
      <Head>
        <title>Pago exitoso</title>
      </Head>

      {/* Encabezado superior */}
      <div className="w-full max-w-md bg-gradient-to-r from-brand-beige/60 to-brand-beige/30 rounded-t-[32px] shadow-md text-center py-8 relative">
        <img
          src="/images/logomelocoton.png"
          alt="Melocotón Move"
          className="w-20 h-20 object-contain mx-auto mb-2 filter brightness-0 saturate-100 invert-[40%] sepia-[10%] hue-rotate-[180deg] contrast-[90%]"
        />
        <h1 className="text-2xl font-extrabold text-brand-blue">
          ¡Pago exitoso!
        </h1>
        <p className="text-sm text-brand-blue/70 mt-1">
          Recibo oficial de compra ✨
        </p>
        {/* Decorativo tipo perforado */}
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-3">
          <div className="w-6 h-6 bg-gray-50 rounded-full shadow-inner"></div>
          <div className="w-6 h-6 bg-gray-50 rounded-full shadow-inner"></div>
        </div>
      </div>

      {/* Recibo principal */}
      <div
        ref={pdfRef}
        className="w-full max-w-md bg-white rounded-b-[32px] shadow-lg border border-gray-100 p-8 relative overflow-hidden"
      >
        <div className="flex justify-between items-start border-b pb-4 mb-4 text-gray-600">
          <div>
            <h2 className="text-lg font-semibold text-brand-blue">
              Melocotón.move
            </h2>
            <p className="text-sm">Correo: {customerEmail ?? "—"}</p>
          </div>
          <div className="text-right text-xs">
            <p>Fecha: {new Date().toLocaleDateString("es-MX")}</p>
            {orderId && (
              <p className="mt-1 break-all max-w-[140px] text-gray-400">
                ID Pedido:
                <br />
                {orderId}
              </p>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <table className="w-full text-sm text-gray-700 mb-4">
          <thead>
            <tr className="border-b text-gray-400">
              <th className="text-left pb-2 font-semibold">Producto</th>
              <th className="text-center pb-2 font-semibold">Cant.</th>
              <th className="text-right pb-2 font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((it, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2">{it.description || "Artículo"}</td>
                <td className="text-center">{it.quantity}</td>
                <td className="text-right font-medium">
                  {fmt(it.amountSubtotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="text-right border-t pt-4 mt-4 text-gray-700">
          {typeof shippingCost === "number" && (
            <p className="text-sm mb-1">
              Envío:{" "}
              <span className="font-medium">{fmt(shippingCost, currency)}</span>
            </p>
          )}
          <p className="text-lg font-bold text-brand-blue mt-1">
            Total pagado: {fmt(amountTotal, currency)}
          </p>
        </div>

        {/* Dirección */}
        {(shippingName || shippingAddress) && (
          <div className="mt-6 border-t pt-4 text-gray-700 text-sm">
            <h3 className="font-semibold text-brand-blue mb-1">
              Dirección de envío
            </h3>
            {shippingName && <p>{shippingName}</p>}
            {shippingAddress && (
              <p className="whitespace-pre-line">{shippingAddress}</p>
            )}
          </div>
        )}

        {/* Footer decorativo */}
        <div className="text-center mt-6 text-xs text-gray-400 select-none">
          — Melocotón.move ✨ —
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-wrap gap-3 mt-8 justify-end max-w-md w-full">
        <button
          onClick={handleDownloadPDF}
          className="border border-brand-blue text-brand-blue px-4 py-2 rounded-lg hover:bg-brand-blue hover:text-white transition text-sm font-medium"
        >
          Descargar factura (PDF)
        </button>
        <button
          onClick={() => router.push("/")}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-beige hover:text-brand-blue transition text-sm font-medium"
        >
          Volver al inicio
        </button>
      </div>
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

    const lineItems = (session.line_items?.data || []).map((li) => ({
      description: li.description || "Artículo",
      quantity: li.quantity || 0,
      amountSubtotal: li.amount_subtotal ?? li.amount_total ?? 0,
    }));

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
        shippingCost: session.shipping_cost?.amount_total ?? null,
        shippingName,
        shippingAddress,
        orderId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id,
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
