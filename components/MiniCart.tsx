"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import MiniCartItem from "./MiniCartItem";
import { createCheckout } from "../lib/checkoutClient";

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
    shippingCost,
    shippingLabel,
    qualifiesForFreeShipping,
    hasCustomShipping,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // 🔁 Recalcular descuento si cambia el subtotal o el cupón aplicado
  // 🔁 Recalcular descuento si cambia el subtotal, el envío o el cupón aplicado
  useEffect(() => {
    if (!appliedCoupon) return;

    const validCode =
      process.env.NEXT_PUBLIC_COUPON_CODE?.trim().toUpperCase() || "";
    const percent = Number(process.env.NEXT_PUBLIC_COUPON_PERCENT) || 0;

    if (appliedCoupon === validCode) {
      // 🔹 Base: subtotal + envío (si aplica)
      const base = subtotal + (hasCustomShipping ? 0 : shippingCost);
      const newDiscount = (base * percent) / 100;
      setDiscount(newDiscount);
    }
  }, [subtotal, shippingCost, hasCustomShipping, appliedCoupon]);

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
      // 🔹 Base para el descuento: subtotal + envío (solo si no es a cotizar)
      const base = subtotal + (hasCustomShipping ? 0 : shippingCost);
      const discountAmt = (base * percent) / 100;

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

  const totalBeforeDiscount = subtotal + (hasCustomShipping ? 0 : shippingCost);
  const total = totalBeforeDiscount - discount;

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
                shippingExcluded={!item.freeShipping}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t bg-white space-y-4">
            {/* Totales */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span>{MX.format(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Envío</span>
                <span>
                  {hasCustomShipping
                    ? "A cotizar"
                    : qualifiesForFreeShipping
                    ? "Gratis"
                    : MX.format(shippingCost)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Descuento ({appliedCoupon})</span>
                  <span>-{MX.format(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-2 mt-2 text-base font-semibold text-brand-blue">
                <span>Total</span>
                <span>{MX.format(total)}</span>
              </div>
            </div>

            {/* Cupón */}
            <div className="mt-3">
              <div className="flex gap-2">
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
                  className={`text-sm mt-1 ${
                    msg.includes("válido") ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  {msg}
                </p>
              )}

              <p className="text-xs mt-2 text-gray-700">{shippingLabel}</p>
            </div>

            {/* Botón */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full py-3 mt-2 rounded-xl font-semibold transition ${
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
