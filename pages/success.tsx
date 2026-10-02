// pages/success.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
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
  shippingLabel?: string | null;
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
  shippingLabel,
  shippingName,
  shippingAddress,
  orderId,
  errorMessage,
}: SuccessProps) {
  const { clearCart, closeCart } = useCart();
  const pdfRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ok) return;

    clearCart();

    try {
      localStorage.removeItem("cart");
    } catch {}

    closeCart();
  }, [ok, clearCart, closeCart]);

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
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    const pdf = new jsPDF({
      unit: "px",
      format: [canvas.width, canvas.height],
      orientation: "portrait",
    });

    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);

    // 🔍 Detectar si es dispositivo móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // 📱 En móvil: abrir en nueva pestaña
      window.open(url, "_blank");
    } else {
      // 💻 En escritorio: forzar descarga
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factura-MelocotonMove-${orderId || "pedido"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
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

      {/* Encabezado */}
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
        <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-3">
          <div className="w-6 h-6 bg-gray-50 rounded-full shadow-inner"></div>
          <div className="w-6 h-6 bg-gray-50 rounded-full shadow-inner"></div>
        </div>
      </div>

      {/* Recibo */}
      <div
        ref={pdfRef}
        className="w-full max-w-md bg-white rounded-b-[32px] shadow-lg border border-gray-100 p-8 relative overflow-hidden"
      >
        <div className="flex justify-between items-start border-b pb-4 mb-4 text-gray-600">
          <div>
            <h2 className="text-lg font-semibold text-brand-blue">
              melocoton.move
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

        {/* Productos */}
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
          <p className="text-sm mb-1">
            Envío:{" "}
            <span className="font-medium">
              {shippingLabel
                ? shippingLabel
                : typeof shippingCost === "number"
                  ? fmt(shippingCost, currency)
                  : "Incluido en el total"}
            </span>
          </p>

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

        <div className="text-center mt-6 text-xs text-gray-400 select-none">
          — melocoton.move —
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-wrap gap-3 mt-8 justify-end max-w-md w-full">
        <button
          onClick={handleDownloadPDF}
          className="border border-brand-blue text-brand-blue px-4 py-2 rounded-lg hover:bg-brand-blue hover:text-white transition text-sm font-medium"
        >
          Descargar recibo (PDF)
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
  ctx,
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

    if (session.payment_status !== "paid") {
      return {
        props: {
          ok: false,
          errorMessage: "El pago todavía no ha sido confirmado por Stripe.",
        },
      };
    }

    if (session.metadata?.source !== "melocoton_ecommerce") {
      return {
        props: {
          ok: false,
          errorMessage: "La sesión de pago no pertenece a Melocotón Move.",
        },
      };
    }

    const lineItems = (session.line_items?.data || [])
      .filter((li) => li.description !== "Costo de envío")
      .map((li) => ({
        description: li.description || "Artículo",
        quantity: li.quantity || 0,
        amountSubtotal: li.amount_subtotal ?? li.amount_total ?? 0,
      }));

    const sd = session.collected_information?.shipping_details ?? null;

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

    const shippingLine = (session.line_items?.data || []).find(
      (li) => li.description === "Costo de envío",
    );

    const shippingCost = shippingLine?.amount_total ?? 0;

    let shippingLabel: string | null = null;

    if (session.metadata?.hasCustomShipping === "true") {
      shippingLabel = "Incluye artículos con envío a cotizar 🚛";
    } else if (shippingCost > 0) {
      shippingLabel = `Costo de envío: ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: (session.currency || "mxn").toUpperCase(),
      }).format(shippingCost / 100)}`;
    } else {
      shippingLabel = "Envío gratis 🚚✨";
    }

    return {
      props: {
        ok: true,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? "mxn",
        customerEmail: session.customer_details?.email ?? null,
        items: lineItems,
        shippingCost,
        shippingLabel,
        shippingName,
        shippingAddress,
        orderId: session.id,
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
