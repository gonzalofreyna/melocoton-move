// ------------------------------------------------------------
// components/ProductCard.tsx
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";
import OfferBadge from "./OfferBadge";
import { ShoppingCart } from "lucide-react";

type Props = {
  product: Product;
  offerBadge: OfferBadgeConfig;
  featureFlags: AppConfig["featureFlags"];
};

export default function ProductCard({
  product,
  offerBadge,
  featureFlags,
}: Props) {
  const { addToCart } = useCart();
  const finalPrice = product.discountPrice ?? product.fullPrice;
  const img = resolveImage(product.image);

  const shouldShowBadge =
    featureFlags?.showOfferBadge &&
    offerBadge?.enabled &&
    typeof product.discountPrice === "number";

  // Stock helpers
  const stock =
    typeof product.stock === "number" ? Math.max(0, product.stock) : undefined;
  const isOut = stock !== undefined ? stock <= 0 : false;
  const isLow = stock !== undefined ? stock > 0 && stock <= 5 : false;
  const stockLabel =
    stock === undefined
      ? null
      : isOut
        ? "Agotado"
        : isLow
          ? "Pocas piezas"
          : "Disponible";
  const stockClass =
    stock === undefined
      ? ""
      : isOut
        ? "bg-[#F8E7E7] text-[#9B4A4A] border-[#E8CACA]"
        : isLow
          ? "bg-[#FFF3D8] text-[#9A6A1F] border-[#F1D9A8]"
          : "bg-[#EAF3E8] text-[#5F7F5C] border-[#D3E4CF]";
  const handleAddToCart = () => {
    if (isOut) return;
    addToCart({
      slug: product.slug,
      name: product.name,
      image: img,
      price: finalPrice,
      freeShipping: product.freeShipping === true,
      maxStock: stock,
      shippingType: product.shippingType || "standard", // 🧩 ✅ Agregado
    });
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-transform transform hover:scale-[1.02] h-full">
      {shouldShowBadge && <OfferBadge cfg={offerBadge} />}

      {/* Imagen */}
      <div className="relative">
        <Link href={`/${product.slug}`} aria-label={`Ir a ${product.name}`}>
          <div className="w-full aspect-square flex items-center justify-center bg-white cursor-pointer">
            <img
              src={img}
              alt={product.name}
              className={`max-h-full max-w-full object-contain ${
                isOut ? "opacity-80" : ""
              }`}
            />
          </div>
        </Link>

        {/* Overlay agotado */}
        {isOut && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1.5 text-sm rounded-full bg-red-600 text-white font-semibold shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="p-4 text-center flex flex-col">
        {/* Nombre y stock */}
        <div className="mb-2 min-h-[3.25rem] sm:min-h-[3.75rem] flex flex-col justify-start">
          {/* Nombre del producto */}
          <h3 className="text-[8px] sm:text-sm lg:text-base font-semibold text-brand-blue leading-snug mb-1 line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] lg:min-h-[2.75rem]">
            {product.name}
          </h3>

          {/* Stock Badge — debajo del nombre, antes de los colores */}
          {stockLabel && (
            <span
              className={`mx-auto inline-flex w-fit items-center rounded-full border px-2 py-[2px] text-[9px] sm:text-[10px] font-medium tracking-wide ${stockClass}`}
            >
              {stockLabel}
            </span>
          )}
        </div>

        {/* Colores */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex justify-center space-x-2 mt-2 min-h-[20px] sm:min-h-[24px]">
            {product.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Precios */}
        <div className="mt-2">
          {typeof product.discountPrice === "number" ? (
            <>
              <p className="text-brand-beige font-bold text-sm sm:text-base lg:text-lg">
                ${product.discountPrice.toFixed(2)} MXN
              </p>
              <p className="text-gray-400 line-through text-[11px] sm:text-xs lg:text-sm">
                ${product.fullPrice.toFixed(2)} MXN
              </p>
            </>
          ) : (
            <p className="text-brand-beige font-bold text-sm sm:text-base lg:text-lg">
              ${product.fullPrice.toFixed(2)} MXN
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
          <button
            onClick={handleAddToCart}
            disabled={isOut}
            className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-brand-blue text-white rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={isOut ? "Producto agotado" : "Añadir al carrito"}
            aria-disabled={isOut}
          >
            <ShoppingCart size={18} />
          </button>

          <Link
            href={`/${product.slug}`}
            className="flex-1 text-center text-[11px] sm:text-xs lg:text-sm text-brand-blue border border-brand-blue py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-colors"
          >
            Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
