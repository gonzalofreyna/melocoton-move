// components/ProductCard.tsx
// Tarjeta editorial mobile-first. La foto abre la ficha; los controles
// de compra usan exactamente la lógica existente del carrito.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";
import OfferBadge from "./OfferBadge";

type Props = {
  product: Product;
  variants?: Product[];
  offerBadge?: OfferBadgeConfig;
  featureFlags?: AppConfig["featureFlags"];
};

const FAVORITES_KEY = "melocoton:favorites:v1";
const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function readFavorites(): string[] {
  try {
    const stored = window.localStorage.getItem(FAVORITES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export default function ProductCard({
  product,
  variants,
  offerBadge,
  featureFlags,
}: Props) {
  const { addToCart } = useCart();
  const [selectedSlug, setSelectedSlug] = useState(product.slug);
  const [showAllColors, setShowAllColors] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Los favoritos se guardan en este navegador, sin solicitar datos personales.
  // Se mantienen sincronizados también entre pestañas.
  useEffect(() => {
    const sync = () => setIsFavorite(readFavorites().includes(product.slug));
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_KEY || event.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [product.slug]);

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const saved = new Set(readFavorites());
      if (next) saved.add(product.slug);
      else saved.delete(product.slug);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...saved]));
    } catch {
      // El icono continúa funcionando durante la sesión si el navegador
      // restringe el almacenamiento local.
    }
  };

  // Precios y existencias siempre provienen de la variante seleccionada.
  const selectedProduct =
    variants?.find((variant) => variant.slug === selectedSlug) ?? product;
  const finalPrice = selectedProduct.discountPrice ?? selectedProduct.fullPrice;
  const imageSrc = resolveImage(selectedProduct.image);
  const productHref = `/${selectedProduct.slug}`;

  const stock =
    typeof selectedProduct.stock === "number"
      ? Math.max(0, selectedProduct.stock)
      : undefined;
  const isOutOfStock = stock !== undefined && stock <= 0;
  const hasDiscount =
    typeof selectedProduct.discountPrice === "number" &&
    selectedProduct.discountPrice > 0 &&
    selectedProduct.discountPrice < selectedProduct.fullPrice;

  const shouldShowBadge =
    featureFlags?.showOfferBadge &&
    offerBadge?.enabled &&
    hasDiscount;

  // Respeta la ubicación de insignias configurada desde el admin y evita
  // que el corazón o el botón + se superpongan sobre ellas.
  const badgePosition = shouldShowBadge ? offerBadge?.position : undefined;
  const favoritePosition = badgePosition === "top-left" ? "right-3" : "left-3";
  const quickAddPosition = badgePosition === "bottom-left" ? "right-3" : "left-3";
  const desktopBuyPosition =
    badgePosition?.startsWith("bottom-") ? "bottom-16" : "bottom-4";

  const colorVariants = (variants ?? [product]).filter(
    (variant) => Boolean(variant.colors?.[0]),
  );
  const visibleColors = showAllColors ? colorVariants : colorVariants.slice(0, 5);
  const hiddenColorCount = Math.max(colorVariants.length - 5, 0);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    // addToCart abre el MiniCart, respetando stock y tipo de envío.
    addToCart({
      slug: selectedProduct.slug,
      name: selectedProduct.name,
      image: imageSrc,
      price: finalPrice,
      freeShipping: selectedProduct.freeShipping === true,
      maxStock: stock,
      shippingType: selectedProduct.shippingType || "standard",
    });
  };

  return (
    <article className="group flex h-full min-w-0 flex-col bg-transparent text-center">
      {/* Imagen protagonista con bordes amplios y fondo blanco puro. */}
      <div className="relative isolate aspect-[3/4] w-full overflow-hidden rounded-[24px] bg-white sm:rounded-[28px]">
        <Link
          href={productHref}
          aria-label={`Ver detalles de ${selectedProduct.name}`}
          className="absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-wine"
        >
          <img
            src={imageSrc}
            alt={selectedProduct.name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-contain transition-transform duration-500 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.025] ${
              isOutOfStock ? "opacity-75" : ""
            }`}
          />
        </Link>

        {shouldShowBadge && offerBadge && <OfferBadge cfg={offerBadge} />}

        {/* Favorito persistente: icono sencillo como en la referencia. */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isFavorite
              ? `Quitar ${product.name} de favoritos`
              : `Guardar ${product.name} en favoritos`
          }
          aria-pressed={isFavorite}
          title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          className={`absolute top-3 ${favoritePosition} z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-brand-ink transition-colors hover:bg-white focus-visible:outline-offset-2 sm:h-10 sm:w-10`}
        >
          <Heart
            size={23}
            strokeWidth={1.75}
            fill={isFavorite ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>

        {isOutOfStock ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <span className="rounded-full border border-brand-line bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
              Agotado
            </span>
          </div>
        ) : (
          <>
            {/* En pantallas táctiles: añadir al carrito con el botón +. */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Añadir ${selectedProduct.name} al carrito`}
              title="Añadir al carrito"
              className={`mm-product-quick-add absolute bottom-3 ${quickAddPosition} z-20 h-10 w-10 items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:bg-brand-sand focus-visible:outline-offset-2 sm:h-11 sm:w-11`}
            >
              <Plus size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>

            {/* Con mouse: CTA negro que emerge sólo al pasar el cursor. */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`mm-product-desktop-buy pointer-events-none absolute ${desktopBuyPosition} inset-x-4 z-20 min-h-12 translate-y-3 items-center justify-center rounded-full bg-black px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-white opacity-0 transition-all duration-300 hover:bg-brand-ink focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none`}
            >
              Comprar ahora
            </button>
          </>
        )}
      </div>

      {/* La información se ubica FUERA de la fotografía. */}
      <div className="flex flex-1 flex-col items-center px-1 pb-2 pt-4 sm:px-2 sm:pt-5">
        <h3 className="min-h-[2.5rem] w-full text-[13px] font-medium leading-[1.35] text-brand-ink sm:text-base">
          <Link href={productHref} className="line-clamp-2 hover:underline hover:underline-offset-2">
            {selectedProduct.name}
          </Link>
        </h3>

        <div className="mt-2 flex min-h-[3rem] flex-col items-center justify-start">
          <p className={`text-sm font-medium sm:text-base ${hasDiscount ? "text-brand-wine" : "text-brand-ink"}`}>
            {priceFormatter.format(finalPrice)}
          </p>
          {hasDiscount && (
            <p className="mt-0.5 text-[11px] text-brand-muted line-through sm:text-xs">
              {priceFormatter.format(selectedProduct.fullPrice)}
            </p>
          )}
        </div>

        {/* Swatches seleccionables: actualizan imagen, precio y stock. */}
        {colorVariants.length > 1 && (
          <div
            role="group"
            aria-label={`Colores de ${product.name}`}
            className="mt-3 flex w-full flex-wrap items-center justify-center gap-2 sm:mt-4 sm:gap-2.5"
          >
            {visibleColors.map((variant) => {
              const color = variant.colors?.[0];
              if (!color) return null;
              const isSelected = selectedProduct.slug === variant.slug;

              return (
                <button
                  key={variant.slug}
                  type="button"
                  onClick={() => setSelectedSlug(variant.slug)}
                  aria-label={`Seleccionar color de ${variant.name}`}
                  aria-pressed={isSelected}
                  title={variant.name}
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border border-black/10 transition-transform hover:scale-110 focus-visible:outline-offset-4 sm:h-5 sm:w-5 ${
                    isSelected
                      ? "ring-[1.5px] ring-brand-ink ring-offset-[3px] ring-offset-white"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
            {hiddenColorCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllColors((current) => !current)}
                aria-expanded={showAllColors}
                aria-label={
                  showAllColors
                    ? "Mostrar menos colores"
                    : `Mostrar ${hiddenColorCount} colores más`
                }
                title={showAllColors ? "Ver menos colores" : "Ver más colores"}
                className="flex h-6 min-w-6 items-center justify-center rounded-full text-sm text-brand-ink hover:bg-brand-sand"
              >
                {showAllColors ? "−" : `+${hiddenColorCount}`}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
