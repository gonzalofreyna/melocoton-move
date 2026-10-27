"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";
import { createCheckout, getPricingPreview, type PricingPreview } from "../lib/checkoutClient";
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
  const [pricing, setPricing] = useState<PricingPreview | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Quote and checkout prices come from the same Lambda calculation.
  useEffect(() => {
    if (!cart.length || !isOpen) {
      setPricing(null);
      setPricingError(null);
      return;
    }
    const controller = new AbortController();
    setPricing(null);
    setPricingLoading(true);
    setPricingError(null);
    const items = cart.map(({ slug, quantity }) => ({ slug, quantity }));
    getPricingPreview(items, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setPricing(result); })
      .catch((error) => {
        if (!controller.signal.aborted) setPricingError(error?.message || "No se pudieron actualizar los precios.");
      })
      .finally(() => { if (!controller.signal.aborted) setPricingLoading(false); });
    return () => controller.abort();
  }, [cart, isOpen]);

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

  // Analytics observes the enabled button click; checkout logic is unchanged.
  const trackCheckoutClick = () => {
    if (!pricing || pricingLoading || pricingError) return;
    try {
      reportGa4BeginCheckout(
        cart.map((item) => ({
          item_id: item.sku?.trim() || item.slug,
          item_name: item.name,
          item_category: item.category,
          price: pricing.items.find((p) => p.slug === item.slug)?.unitPrice ?? item.price,
          quantity: item.quantity,
        })),
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
      if (!pricing || pricingLoading || pricingError) throw new Error("Actualiza los precios antes de pagar.");
      const data = await createCheckout(items);

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

  const total = pricing?.total ?? subtotal;

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
                    specialUnitPrice={pricing?.items.find((line) => line.slug === item.slug && line.wholesale)?.unitPrice}
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
                  <span>{MX.format(pricing?.subtotal ?? subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Envío</span>
                  <span>
                    Gratis
                  </span>
                </div>

                {pricing && pricing.discount > 0 && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Descuento especial</span>
                    <span>-{MX.format(pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-brand-line pt-3 mt-3 text-base font-semibold text-brand-blue">
                  <span>Total</span>
                  <span>{MX.format(total)}</span>
                </div>
              </div>

              {pricingLoading && <p className="text-sm text-gray-600">Actualizando precios…</p>}
              {pricingError && <p role="alert" className="text-sm text-red-600">{pricingError}</p>}
              {pricing && pricing.config.enabled && (
                <p className="text-xs text-gray-600">
                  Precio especial al elegir {pricing.config.minQty} o más artículos de la misma categoría.
                </p>
              )}

              {/* Botón */}
              <button
                onClick={() => { trackCheckoutClick(); void handleCheckout(); }}
                disabled={loading || pricingLoading || !pricing || !!pricingError}
                className={`w-full py-3.5 mt-2 rounded-2xl font-semibold text-[15px] shadow-sm transition ${
                  loading
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-brand-blue text-white hover:bg-brand-beige hover:text-brand-blue"
                }`}
              >
                {loading ? "Procesando..." : pricingLoading ? "Calculando precios..." : "Finalizar compra"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
