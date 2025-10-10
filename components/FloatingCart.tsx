// components/FloatingCart.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

/**
 * FloatingCart
 * — Botón flotante fijo que abre el MiniCart lateral
 * — Vive globalmente (en _app.tsx)
 * — Seguro para notch con env(safe-area-inset-bottom)
 */
export default function FloatingCart() {
  const router = useRouter();
  const { cartCount, toggleCart } = useCart();

  // Ocultar en caso de que quieras evitarlo en ciertas rutas (opcional)
  const hidden = useMemo(() => false, [router.pathname]);
  if (hidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed z-[60] right-4 bottom-4 md:right-6 md:bottom-6 pointer-events-none"
    >
      <button
        onClick={toggleCart}
        aria-label={`Abrir carrito${
          cartCount
            ? `, ${cartCount} elemento${cartCount === 1 ? "" : "s"}`
            : ""
        }`}
        className="pointer-events-auto group relative flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-brand-blue text-white shadow-xl shadow-black/10 ring-2 ring-white hover:shadow-2xl transition-all"
      >
        <ShoppingCartIcon className="h-7 w-7 md:h-8 md:w-8 transition-transform group-hover:scale-110" />

        {/* Badge contador */}
        {cartCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[1.5rem] px-1.5 py-0.5 rounded-full bg-brand-beige text-brand-blue text-[11px] md:text-xs font-bold text-center ring-1 ring-black/5"
            aria-hidden
          >
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </button>

      {/* Safe area para iOS notch/bottom */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </motion.div>
  );
}
