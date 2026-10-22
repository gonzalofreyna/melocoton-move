"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";
import { createCheckout } from "../lib/checkoutClient";
import { reportGa4BeginCheckout } from "../lib/ga4Ecommerce";

const MX = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function MiniCart() {
  const {
    cart,
    subtotal,
    isOpen,
    closeCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Mantener el descuento sincronizado con el subtotal
  useEffect(() => {
    if (!appliedCoupon) return;

    const validCode =
      process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";

    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;

    if (appliedCoupon === validCode) {
      const newDiscount = (subtotal * percent) / 100;

      setDiscount(newDiscount);
    }
  }, [subtotal, appliedCoupon]);

  // 🧹 Limpiar cupón si el carrito queda vacío
  useEffect(() => {
    if (cart.length === 0) {
      setAppliedCoupon(null);
      setDiscount(0);
      setMsg(null);
      setCoupon("");
    }
  }, [cart]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // Focus trap básico
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea",
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  const handleApplyCoupon = async () => {
    const cleanCode = coupon.trim().toUpperCase();
    const validCode = process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";
    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;
    if (validCode && cleanCode === validCode) {
      setDiscount((subtotal * percent) / 100);
      setAppliedCoupon(validCode);
      setMsg(`Cupón aplicado: -${percent}%`);
    } else {
      setMsg("Código no válido.");
    }
  };

  // Analytics observes the enabled button click; checkout logic is unchanged.
  const trackCheckoutClick = () => {
    try {
      reportGa4BeginCheckout(
        cart.map((item) => ({
          item_id: item.sku?.trim() || item.slug,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
        appliedCoupon ?? undefined,
      );
    } catch (analyticsError) {
      console.warn("GA4 begin_checkout no disponible", analyticsError);
    }
  };

  const handleCheckout = async () => {
    try {
      setMsg(null);
      setLoading(true);

      const invalid = cart.find((i) => !i.slug || typeof i.slug !== "string");
      if (invalid) {
        setMsg(
          "Un producto de tu carrito pertenece a una versión anterior. Elimínalo y vuelve a agregarlo.",
        );
        setLoading(false);
        return;
      }

      const items = cart.map((i) => ({
        slug: i.slug,
        quantity: i.quantity,
      }));

      // ✅ Llamada al endpoint AWS (usa createCheckout de src/lib/checkoutClient)
      const data = await createCheckout(items, appliedCoupon ?? undefined);

      if (!data?.ok || !data?.url) {
        throw new Error(data?.message || "No se recibió URL de Stripe.");
      }

      window.location.href = data.url; // 🚀 redirige al checkout de Stripe
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Error en checkout.");
    } finally {
      setLoading(false);
    }
  };

  const total = subtotal - discount;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-[1100] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] bg-[#FFFEFC] shadow-[0_10px_40px_rgba(15,23,42,0.10)] transform transition-transform duration-300 z-[1110] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 sm:px-5 sm:py-5 border-b border-brand-line bg-white/80 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-brand-blue">
            Tu carrito
          </h2>
          <button
            onClick={closeCart}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-brand-blue hover:bg-gray-100 transition text-xl leading-none"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-3">
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center mt-12 text-base">
                Tu carrito está vacío 🛍️
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.slug}>
                  <MiniCartItem
                    slug={item.slug}
                    name={item.name}
                    image={item.image}
                    price={item.price}
                    quantity={item.quantity}
                    shippingExcluded={false}
                  />

                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-brand-line bg-white px-4 py-4 sm:px-5 sm:py-5 space-y-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
              <div className="rounded-2xl border border-brand-line bg-white px-4 py-3.5">
                <p className="text-sm font-semibold tracking-wide text-brand-blue">Envío de cortesía</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">Incluido en tu pedido, sin costo adicional.</p>
              </div>
              {/* Totales */}
              <div className="rounded-2xl bg-brand-cream border border-brand-line px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal</span>
                  <span>{MX.format(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Envío</span>
                  <span>
                    Gratis
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Descuento ({appliedCoupon})</span>
                    <span>-{MX.format(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-brand-line pt-3 mt-3 text-base font-semibold text-brand-blue">
                  <span>Total</span>
                  <span>{MX.format(total)}</span>
                </div>
              </div>

              {/* Cupón */}
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Cupón"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 rounded-xl border border-brand-line bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="mm-button w-full sm:w-auto"
                  >
                    Aplicar
                  </button>
                </div>

                {msg && (
                  <p
                    className={`text-sm mt-1 ${
                      msg.includes("válido") ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {msg}
                  </p>
                )}

              </div>

              {/* Botón */}
              <button
                onClick={() => { trackCheckoutClick(); void handleCheckout(); }}
                disabled={loading}
                className={`w-full py-3.5 mt-2 rounded-2xl font-semibold text-[15px] shadow-sm transition ${
                  loading
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-brand-blue text-white hover:bg-brand-beige hover:text-brand-blue"
                }`}
              >
                {loading ? "Procesando..." : "Finalizar compra"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
