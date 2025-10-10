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
  stock: number;
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Imagen */}
      <div className="flex-shrink-0 mx-auto sm:mx-0">
        <img
          src={image}
          alt={name}
          width={80}
          height={80}
          loading="lazy"
          className="rounded-xl object-cover w-20 h-20"
        />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Nombre */}
          <h3 className="text-[15px] sm:text-base font-medium text-gray-800 leading-snug break-words">
            {name}
          </h3>

          {/* Aviso debajo del nombre */}
          {shippingExcluded && (
            <span className="inline-flex items-center gap-1 self-start text-[10px] sm:text-[11px] px-2 py-[2px] rounded-md bg-yellow-50 text-yellow-800 border border-yellow-100 font-medium mt-0.5">
              <ExclamationTriangleIcon className="h-3 w-3" />
              Sin envío gratis
            </span>
          )}

          {/* Precio */}
          <p className="text-gray-700 text-sm sm:text-base mt-1">
            {fmtCurrency(price)}
          </p>
        </div>

        {/* Cantidad y total */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Controles cantidad */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => updateQuantity(slug, Math.max(quantity - 1, 1))}
              className="w-8 h-8 text-lg font-semibold text-gray-600 hover:bg-gray-100 transition"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-10 text-center text-sm text-gray-800">
              {quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(slug, Math.min(quantity + 1, stock))
              }
              className="w-8 h-8 text-lg font-semibold text-gray-600 hover:bg-gray-100 transition"
              aria-label="Aumentar cantidad"
              disabled={quantity >= stock}
            >
              +
            </button>
          </div>

          {/* Total */}
          <p className="font-semibold text-brand-blue text-right text-sm sm:text-lg">
            {fmtCurrency(price * quantity)}
          </p>
        </div>

        {/* Stock */}
        <p className="mt-1 text-xs text-gray-500">Stock: {stock}</p>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => removeFromCart(slug)}
        className="text-red-500 hover:text-red-600 ml-auto sm:ml-2 mt-2 sm:mt-0"
        aria-label="Eliminar producto del carrito"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
