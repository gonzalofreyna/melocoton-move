import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

/**
 * FloatingCart
 * — Botón flotante, siempre visible, que muestra el contador del carrito
 * — Vive globalmente (ponlo en _app.tsx o en tu Layout root)
 * — Accesible (aria-label, focus ring) y seguro para notch con env(safe-area-inset-bottom)
 * — Se oculta en la ruta /cart para evitar duplicar el CTA
 */
export default function FloatingCart() {
  const router = useRouter();
  const { cartCount } = useCart();

  // Ocultar en la página de carrito
  const hidden = useMemo(() => router.pathname === "/cart", [router.pathname]);
  if (hidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed z-[60] right-4 bottom-4 md:right-6 md:bottom-6 pointer-events-none"
    >
      <Link
        href="/cart"
        aria-label={`Abrir carrito${
          cartCount
            ? `, ${cartCount} elemento${cartCount === 1 ? "" : "s"}`
            : ""
        }`}
        className="pointer-events-auto group"
      >
        <div className="relative flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-brand-blue text-white shadow-xl shadow-black/10 ring-2 ring-white hover:shadow-2xl transition-all">
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
        </div>
      </Link>

      {/* Safe area para iOS notch/bottom */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </motion.div>
  );
}
