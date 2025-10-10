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
      ? "bg-red-100 text-red-700 border-red-200"
      : isLow
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-green-100 text-green-700 border-green-200";

  const handleAddToCart = () => {
    if (isOut) return;
    addToCart({
      slug: product.slug,
      name: product.name,
      image: img,
      price: finalPrice,
      freeShipping: product.freeShipping === true,
      maxStock: stock,
    });
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-transform transform hover:scale-105">
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

        {/* Franja de envío */}
        {product.freeShipping === true && (
          <div className="absolute inset-x-0 bottom-0">
            <div className="bg-black/30 backdrop-blur-[2px]">
              <div className="px-3 py-2 text-center text-white text-[12px] tracking-wide">
                Envío gratis
              </div>
            </div>
          </div>
        )}

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
      <div className="p-4 text-center">
        {/* Nombre y stock */}
        <div className="mb-3">
          {/* Nombre del producto */}
          <h3 className="text-base sm:text-lg font-semibold text-brand-blue leading-snug mb-1">
            {product.name}
          </h3>

          {/* Stock Badge — debajo del nombre, antes de los colores */}
          {stockLabel && (
            <span
              className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${stockClass}`}
            >
              {stockLabel}
            </span>
          )}
        </div>

        {/* Colores */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex justify-center space-x-2 mt-2">
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
              <p className="text-brand-blue font-bold text-base sm:text-lg">
                ${product.discountPrice.toFixed(2)} MXN
              </p>
              <p className="text-gray-400 line-through text-xs sm:text-sm">
                ${product.fullPrice.toFixed(2)} MXN
              </p>
            </>
          ) : (
            <p className="text-brand-beige font-bold text-base sm:text-lg">
              ${product.fullPrice.toFixed(2)} MXN
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={handleAddToCart}
            disabled={isOut}
            className="flex items-center justify-center bg-brand-blue text-white p-2 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isOut ? "Producto agotado" : "Añadir al carrito"}
            aria-disabled={isOut}
          >
            <ShoppingCart size={18} />
          </button>

          <Link
            href={`/${product.slug}`}
            className="flex-1 text-center text-xs sm:text-sm text-brand-blue border border-brand-blue py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-colors"
          >
            Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
