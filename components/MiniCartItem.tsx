"use client";

import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../context/CartContext";

type MiniCartItemProps = {
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock?: number; // ✅ opcional
  shippingExcluded?: boolean;
};

export default function MiniCartItem({
  slug,
  name,
  image,
  price,
  quantity,
  stock,
  shippingExcluded,
}: MiniCartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);

  // ✅ Máximo seguro (si no hay stock definido, deja crecer libremente)
  const maxQuantity = stock ?? 99;

  return (
    <div className="relative flex flex-col sm:flex-row items-start gap-4 p-4 bg-white rounded-3xl shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-neutral-200/80">
      {/* Imagen */}
      <div className="flex-shrink-0 mx-auto sm:mx-0">
        <img
          src={image}
          alt={name}
          width={80}
          height={80}
          loading="lazy"
          className="rounded-2xl object-cover w-20 h-20 border border-neutral-200 bg-[#FAF8F4]"
        />
      </div>
      {/* Contenido principal */}
      <div className="flex-1 w-full min-w-0 pr-8">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Nombre */}
          <h3 className="text-[15px] sm:text-base font-semibold tracking-[-0.01em] text-gray-800 leading-snug break-words">
            {name}
          </h3>

          {/* Aviso debajo del nombre */}
          {shippingExcluded && (
            <span className="inline-flex items-center gap-1 self-start text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium mt-0.5">
              <ExclamationTriangleIcon className="h-3 w-3" />
              Sin envío gratis
            </span>
          )}

          {/* Precio unitario */}
          <p className="text-gray-500 text-sm mt-1">{fmtCurrency(price)}</p>
        </div>

        {/* Cantidad y total */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Controles cantidad */}
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-[#FAFAF8]">
            <button
              onClick={() => updateQuantity(slug, Math.max(quantity - 1, 1))}
              className="w-9 h-9 text-lg font-semibold text-gray-600 hover:bg-white transition"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium text-gray-800">
              {quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(slug, Math.min(quantity + 1, maxQuantity))
              }
              className="w-9 h-9 text-lg font-semibold text-gray-600 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Aumentar cantidad"
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>

          {/* Total */}
          <p className="font-semibold text-brand-blue text-right text-base sm:text-lg tracking-[-0.01em]">
            {fmtCurrency(price * quantity)}
          </p>
        </div>
      </div>
      {/* Eliminar */}
      <button
        onClick={() => removeFromCart(slug)}
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
        aria-label="Eliminar producto del carrito"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
