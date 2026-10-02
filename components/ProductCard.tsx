// ------------------------------------------------------------
// components/ProductCard.tsx
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";
import OfferBadge from "./OfferBadge";
import { ShoppingCart } from "lucide-react";

type Props = {
  product: Product;
  variants?: Product[];
  offerBadge: OfferBadgeConfig;
  featureFlags: AppConfig["featureFlags"];
};

export default function ProductCard({
  product,
  variants,
  offerBadge,
  featureFlags,
}: Props) {
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product>(product);
  const finalPrice = selectedProduct.discountPrice ?? selectedProduct.fullPrice;
  const img = resolveImage(selectedProduct.image);

  const shouldShowBadge =
    featureFlags?.showOfferBadge &&
    offerBadge?.enabled &&
    typeof selectedProduct.discountPrice === "number";

  // Stock helpers
  const stock =
    typeof selectedProduct.stock === "number"
      ? Math.max(0, selectedProduct.stock)
      : undefined;
  const isOut = stock !== undefined ? stock <= 0 : false;

  const handleAddToCart = () => {
    if (isOut) return;
    addToCart({
      slug: selectedProduct.slug,
      name: selectedProduct.name,
      image: img,
      price: finalPrice,
      freeShipping: selectedProduct.freeShipping === true,
      maxStock: stock,
      shippingType: selectedProduct.shippingType || "standard",
    });
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-transform transform hover:scale-[1.02] h-full">
      {shouldShowBadge && <OfferBadge cfg={offerBadge} />}

      {/* Imagen */}
      <div className="relative">
        <Link
          href={`/${selectedProduct.slug}`}
          aria-label={`Ir a ${selectedProduct.name}`}
        >
          <div className="w-full aspect-square flex items-center justify-center bg-white cursor-pointer">
            <img
              src={img}
              alt={selectedProduct.name}
              className={`max-h-full max-w-full object-contain ${
                isOut ? "opacity-80" : ""
              }`}
            />
          </div>
        </Link>

        {/* Overlay agotado */}
        {isOut && (
          <div className="absolute inset-0 bg-white/55 backdrop-blur-[1.5px] flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-white/95 border border-gray-200 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 shadow-sm">
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
            {selectedProduct.name}
          </h3>
        </div>

        {/* Variantes por color */}
        {variants && variants.length > 1 && (
          <div className="mt-3 min-h-[24px] flex items-center justify-center gap-2">
            {variants.slice(0, 8).map((variant) => {
              const color = variant.colors?.[0];
              const isSelected = selectedProduct.slug === variant.slug;

              if (!color) return null;

              return (
                <button
                  key={variant.slug}
                  type="button"
                  onClick={() => setSelectedProduct(variant)}
                  aria-label={`Seleccionar ${variant.name}`}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border shadow-sm transition-all ${
                    isSelected
                      ? "ring-2 ring-brand-blue ring-offset-2 border-white"
                      : "border-gray-300 hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              );
            })}

            {variants.length > 8 && (
              <span className="ml-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                +{variants.length - 8} colores
              </span>
            )}
          </div>
        )}
        {/* Precios */}
        <div className="mt-2">
          {typeof selectedProduct.discountPrice === "number" ? (
            <>
              <p className="text-brand-beige font-bold text-sm sm:text-base lg:text-lg">
                ${selectedProduct.discountPrice.toFixed(2)} MXN
              </p>
              <p className="text-gray-400 line-through text-[11px] sm:text-xs lg:text-sm">
                ${selectedProduct.fullPrice.toFixed(2)} MXN
              </p>
            </>
          ) : (
            <p className="text-brand-beige font-bold text-sm sm:text-base lg:text-lg">
              ${selectedProduct.fullPrice.toFixed(2)} MXN
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
            href={`/${selectedProduct.slug}`}
            className="flex-1 text-center text-[11px] sm:text-xs lg:text-sm text-brand-blue border border-brand-blue py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-colors"
          >
            Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
