// components/CartButton.tsx
"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

type Props = {
  className?: string;
  showLabel?: boolean;
};

export default function CartButton({
  className = "",
  showLabel = false,
}: Props) {
  const { cartCount, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-brand-blue hover:bg-brand-blue hover:text-white transition ${className}`}
      aria-label="Abrir carrito"
      title="Abrir carrito"
    >
      <ShoppingCart size={18} />
      {showLabel && <span>Carrito</span>}

      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 text-center">
          {cartCount}
        </span>
      )}
    </button>
  );
}
