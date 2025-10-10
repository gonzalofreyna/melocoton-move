"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";

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
    allItemsFreeShipping,
    hasAnyNonFreeShipping,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

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
      "button, [href], input, select, textarea"
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

  const handleApplyCoupon = () => {
    const validCode =
      process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";
    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;

    if (!coupon.trim()) {
      setMsg("Introduce un código de descuento.");
      return;
    }

    if (coupon.trim().toUpperCase() === validCode) {
      const discountAmt = (subtotal * percent) / 100;
      setDiscount(discountAmt);
      setAppliedCoupon(validCode);
      setMsg(`Cupón aplicado: -${percent}%`);
    } else {
      setDiscount(0);
      setAppliedCoupon(null);
      setMsg("Código no válido.");
    }
  };

  const handleCheckout = async () => {
    try {
      setMsg(null);
      setLoading(true);

      const invalid = cart.find((i) => !i.slug || typeof i.slug !== "string");
      if (invalid) {
        setMsg(
          "Un producto de tu carrito pertenece a una versión anterior. Elimínalo y vuelve a agregarlo."
        );
        setLoading(false);
        return;
      }

      const items = cart.map((i) => ({
        slug: i.slug,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          coupon: appliedCoupon ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok)
        throw new Error(data?.message || "Error en checkout");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg("No se recibió URL de Stripe.");
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
        className={`fixed top-0 right-0 h-full w-[380px] md:w-[420px] bg-white shadow-xl transform transition-transform duration-300 z-[1110] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-semibold text-brand-blue">Tu Carrito</h2>
          <button
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <p className="text-gray-600 text-center mt-12 text-base">
              Tu carrito está vacío 🛍️
            </p>
          ) : (
            cart.map((item) => (
              <MiniCartItem
                key={item.slug}
                slug={item.slug}
                name={item.name}
                image={item.image}
                price={item.price}
                quantity={item.quantity}
                stock={item.maxStock || 99}
                shippingExcluded={!item.freeShipping}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t space-y-3 bg-white">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{MX.format(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Descuento ({appliedCoupon})</span>
                <span>-{MX.format(discount)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-brand-blue text-lg">
              <span>Total:</span>
              <span>{MX.format(total)}</span>
            </div>

            {/* Cupón */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Cupón"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleApplyCoupon}
                className="bg-brand-blue text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-beige hover:text-brand-blue transition"
              >
                Aplicar
              </button>
            </div>

            {msg && (
              <p
                className={`text-sm ${
                  msg.includes("válido") ? "text-red-600" : "text-gray-700"
                }`}
              >
                {msg}
              </p>
            )}

            <p className="text-xs mt-2">
              {hasAnyNonFreeShipping ? (
                <span className="text-yellow-800">
                  Este pedido no incluye envío gratis.
                </span>
              ) : (
                <span className="text-green-700">
                  Envío gratis incluido 🚚✨
                </span>
              )}
            </p>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full py-3 mt-3 rounded-xl font-semibold transition ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-brand-blue text-white hover:bg-brand-beige hover:text-brand-blue"
              }`}
            >
              {loading ? "Procesando..." : "Finalizar compra"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
