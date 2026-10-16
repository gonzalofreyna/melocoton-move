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
  shippingProvider?: string | null;
  shippingService?: string | null;
  orderId?: string | null;
  personalized?: boolean;
  promotion?: string | null;
  stripeReceiptUrl?: string | null;
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
  shippingProvider,
  shippingService,
  shippingName,
  shippingAddress,
  orderId,
  personalized,
  promotion,
  stripeReceiptUrl,
  errorMessage,
}: SuccessProps) {
  const { clearCart, closeCart } = useCart();
  const pdfRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ok || personalized) return;

    clearCart();

    try {
      localStorage.removeItem("cart");
    } catch {}

    closeCart();
  }, [ok, personalized, clearCart, closeCart]);

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
    <main className="flex flex-col items-center px-3 py-6 sm:px-4 sm:py-12 bg-gray-50 min-h-screen">
      <Head>
        <title>Pago exitoso</title>
      </Head>

      {/* Encabezado */}
      <div className="w-full max-w-md bg-gradient-to-r from-brand-beige/60 to-brand-beige/30 rounded-t-[24px] sm:rounded-t-[32px] shadow-md text-center py-5 sm:py-8 relative">
        <img
          src="/images/logomelocoton.png"
          alt="Melocotón Move"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-2 filter brightness-0 saturate-100 invert-[40%] sepia-[10%] hue-rotate-[180deg] contrast-[90%]"
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
        className="w-full max-w-md bg-white rounded-b-[24px] sm:rounded-b-[32px] shadow-lg border border-gray-100 p-4 sm:p-8 relative overflow-hidden"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start border-b pb-4 mb-4 text-gray-600">
          <div>
            <h2 className="text-lg font-semibold text-brand-blue">
              melocoton.move
            </h2>
            <p className="text-sm">Correo: {customerEmail ?? "—"}</p>
          </div>
          <div className="text-left sm:text-right text-xs">
            <p>Fecha: {new Date().toLocaleDateString("es-MX")}</p>
            {orderId && (
              <p className="mt-1 break-all sm:max-w-[140px] text-gray-400">
                ID Pedido:
                <br />
                {orderId}
              </p>
            )}
          </div>
        </div>

        {/* Productos */}
        <table className="w-full text-sm text-gray-700 mb-4 table-fixed">
          <thead>
            <tr className="border-b text-gray-400">
              <th className="text-left pb-2 font-semibold w-[55%]">Producto</th>
              <th className="text-center pb-2 font-semibold w-[15%]">Cant.</th>
              <th className="text-right pb-2 font-semibold w-[30%]">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((it, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 pr-2 break-words">
                  {it.description || "Artículo"}
                </td>
                <td className="text-center">{it.quantity}</td>
                <td className="text-right font-medium">
                  {fmt(it.amountSubtotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t pt-4 mt-4 text-gray-700">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
              Envío
            </p>

            <p className="text-sm font-medium text-gray-800">
              {shippingLabel || "Envío"}
            </p>

            {(shippingProvider || shippingService) && (
              <p className="text-xs text-gray-500 mt-1">
                {[shippingProvider, shippingService]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <p className="text-lg font-bold text-brand-blue mt-1 text-right">
            Total pagado: {fmt(amountTotal, currency)}
          </p>
        </div>

        {personalized && (
          <div className="mt-5 rounded-xl border border-brand-line bg-brand-sand p-4 text-sm leading-6 text-brand-ink">
            <p><strong>Promoción:</strong> {promotion === "msi5" ? "5% de descuento con opción de MSI" : "5×4 sin MSI"}</p>
            <p><strong>Entrega estimada:</strong> 45 días hábiles.</p>
            <p><strong>Envío:</strong> se cotiza y paga por separado; no está incluido en este recibo.</p>
            <p>Melocotón Move se comunicará contigo para acordar tu diseño. No es necesario haber subido un logo.</p>
          </div>
        )}

        {/* Dirección */}
        {(shippingName || shippingAddress) && (
          <div className="mt-5 border-t pt-4 text-gray-700 text-sm leading-relaxed">
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
      <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 sm:justify-end max-w-md w-full">
        {personalized && stripeReceiptUrl && (
          <a href={stripeReceiptUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto border border-brand-blue text-brand-blue px-4 py-3 sm:py-2 rounded-xl text-center text-sm font-medium">Ver recibo oficial de Stripe</a>
        )}
        <button
          onClick={handleDownloadPDF}
          className="w-full sm:w-auto border border-brand-blue text-brand-blue px-4 py-3 sm:py-2 rounded-xl hover:bg-brand-blue hover:text-white transition text-sm font-medium"
        >
          Descargar recibo (PDF)
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full sm:w-auto bg-brand-blue text-white px-4 py-3 sm:py-2 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition text-sm font-medium"
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
    // Independent personalized credentials use the SAME variable in test and
    // live. Deployment environments supply sk_test_ or sk_live_ accordingly.
    // Preserve the existing ecommerce key and flow unchanged.
    const isTestSession = sessionId.startsWith("cs_test_");
    const isLiveSession = sessionId.startsWith("cs_live_");
    if (!isTestSession && !isLiveSession) {
      return { props: { ok: false, errorMessage: "Identificador de pago inválido." } };
    }

    const personalizedKey = process.env.PERSONALIZED_MAT_STRIPE_SECRET_KEY;
    const normalKey = process.env.STRIPE_SECRET_KEY;
    let session: import("stripe").Stripe.Checkout.Session | null = null;
    let stripe: InstanceType<typeof Stripe> | null = null;

    if (personalizedKey) {
      // Only sessions from the configured test/live environment can be fetched.
      const personalizedIsTest = personalizedKey.startsWith("sk_test_");
      const personalizedIsLive = personalizedKey.startsWith("sk_live_");
      if ((isTestSession && personalizedIsTest) || (isLiveSession && personalizedIsLive)) {
        try {
          const candidateStripe = new Stripe(personalizedKey);
          const candidate = await candidateStripe.checkout.sessions.retrieve(sessionId, {
            expand: ["line_items", "payment_intent"],
          });
          if (candidate.metadata?.source === "melocoton_personalized_mat") {
            session = candidate;
            stripe = candidateStripe;
          }
        } catch {
          // Not found in personalized account/environment; try existing ecommerce.
        }
      }
    }

    if (!session && normalKey) {
      const normalStripe = new Stripe(normalKey);
      const candidate = await normalStripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent"],
      });
      if (candidate.metadata?.source !== "melocoton_ecommerce") {
        return { props: { ok: false, errorMessage: "Esta sesión no pertenece al checkout normal." } };
      }
      session = candidate;
      stripe = normalStripe;
    }
    if (!session || !stripe || session.livemode !== isLiveSession) {
      return { props: { ok: false, errorMessage: "No fue posible verificar el pago en su entorno." } };
    }

    if (session.payment_status !== "paid") {
      return {
        props: {
          ok: false,
          errorMessage: "El pago todavía no ha sido confirmado por Stripe.",
        },
      };
    }

    const personalized = session.metadata?.source === "melocoton_personalized_mat";
    if (session.metadata?.source !== "melocoton_ecommerce" && !personalized) {
      return {
        props: {
          ok: false,
          errorMessage: "La sesión de pago no pertenece a Melocotón Move.",
        },
      };
    }

    const lineItems = personalized
      ? [{
          description: "Mat profesional personalizado" + (session.metadata?.promotion === "fiveFour" ? " · 5×4" : " · 5%"),
          quantity: Number(session.metadata?.quantity) || 0,
          amountSubtotal: session.amount_total ?? 0,
        }]
      : (session.line_items?.data || [])
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

    const shippingProvider = session.metadata?.shippingProvider?.trim() || null;

    const shippingService = session.metadata?.shippingService?.trim() || null;

    const shippingPromoApplied =
      session.metadata?.shippingPromoApplied === "true";

    const freeShipping = session.metadata?.freeShipping === "true";

    let shippingLabel: string | null =
      session.metadata?.shippingLabel?.trim() || null;

    if (personalized) shippingLabel = "Envío por cotizar y pagar por separado";
    if (!shippingLabel) {
      if (session.metadata?.hasCustomShipping === "true") {
        shippingLabel = "Incluye artículos con envío a cotizar";
      } else if (shippingPromoApplied) {
        shippingLabel = "Envío gratis por código promocional";
      } else if (freeShipping) {
        shippingLabel = "Envío gratis";
      } else if (shippingCost > 0) {
        shippingLabel = `Costo de envío: ${new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: (session.currency || "mxn").toUpperCase(),
        }).format(shippingCost / 100)}`;
      } else {
        shippingLabel = "Envío";
      }
    }

    let stripeReceiptUrl: string | null = null;
    if (personalized && session.payment_intent && typeof session.payment_intent !== "string") {
      const chargeId = session.payment_intent.latest_charge;
      if (typeof chargeId === "string") {
        const charge = await stripe.charges.retrieve(chargeId);
        stripeReceiptUrl = charge.receipt_url || null;
      }
    }

    return {
      props: {
        ok: true,
        personalized,
        promotion: personalized ? session.metadata?.promotion || null : null,
        stripeReceiptUrl,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? "mxn",
        customerEmail: session.customer_details?.email ?? null,
        items: lineItems,
        shippingCost,
        shippingLabel,
        shippingProvider,
        shippingService,
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
