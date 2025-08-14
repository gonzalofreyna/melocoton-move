// components/ProductCard.tsx
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";

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

  return (
    <div className="relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-transform transform hover:scale-105">
      {/* Badge de oferta (configurable desde AC) */}
      {shouldShowBadge && <OfferBadge cfg={offerBadge} />}

      {/* Imagen con enlace */}
      <Link href={`/${product.slug}`}>
        <div className="w-full aspect-square flex items-center justify-center bg-white cursor-pointer">
          <img
            src={img}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </Link>

      <div className="p-4 text-center">
        {/* Nombre */}
        <h3 className="text-lg font-semibold text-brand-blue">
          {product.name}
        </h3>

        {/* Colores disponibles */}
        {product.colors && (
          <div className="flex justify-center space-x-2 mt-2">
            {product.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Precios */}
        <div className="mt-2">
          {typeof product.discountPrice === "number" ? (
            <>
              <p className="text-brand-blue font-bold text-lg">
                ${product.discountPrice.toFixed(2)} MXN
              </p>
              <p className="text-gray-400 line-through text-sm">
                ${product.fullPrice.toFixed(2)} MXN
              </p>
            </>
          ) : (
            <p className="text-brand-beige font-bold text-lg">
              ${product.fullPrice.toFixed(2)} MXN
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() =>
              addToCart({
                name: product.name,
                image: img,
                price: finalPrice,
              })
            }
            className="w-full bg-brand-blue text-white py-2 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors"
          >
            Agregar al carrito
          </button>

          <Link
            href={`/${product.slug}`}
            className="w-full inline-block text-sm text-brand-blue border border-brand-blue py-2 rounded-xl hover:bg-brand-blue hover:text-white transition-colors"
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- Badge configurable ---------- */

function OfferBadge({ cfg }: { cfg: OfferBadgeConfig }) {
  const posCls = positionClass(cfg.position);
  const shapeCls = shapeClass(cfg.shape);
  const sizeCls = sizeClass(cfg.size);
  const textTransform = cfg.uppercase ? "uppercase" : "";

  // Estilos desde AC
  const style = {
    backgroundColor: cfg.colors.bg,
    color: cfg.colors.text,
    borderColor: cfg.colors.border,
  } as React.CSSProperties;

  const showIcon = cfg.mode !== "text" && cfg.icon?.enabled && !!cfg.icon.src;
  const showText = cfg.mode !== "icon" && !!cfg.text?.trim();

  return (
    <div
      className={`absolute ${posCls} z-10 border shadow-md ${shapeCls} ${sizeCls} ${textTransform} inline-flex items-center gap-1`}
      style={style}
    >
      {showIcon && (
        <img
          src={cfg.icon!.src}
          alt={cfg.icon!.alt || ""}
          width={cfg.icon!.size}
          height={cfg.icon!.size}
          className="inline-block"
        />
      )}
      {showText && (
        <span className="font-semibold leading-none">{cfg.text}</span>
      )}
    </div>
  );
}

function positionClass(pos: OfferBadgeConfig["position"]): string {
  switch (pos) {
    case "top-left":
      return "top-3 left-3";
    case "top-right":
      return "top-3 right-3";
    case "bottom-left":
      return "bottom-3 left-3";
    case "bottom-right":
      return "bottom-3 right-3";
    default:
      return "top-3 left-3";
  }
}

function shapeClass(shape: OfferBadgeConfig["shape"]): string {
  switch (shape) {
    case "pill":
      return "rounded-full";
    case "rounded":
      return "rounded-md";
    case "square":
      return "rounded-none";
    default:
      return "rounded-md";
  }
}

function sizeClass(size: OfferBadgeConfig["size"]): string {
  switch (size) {
    case "sm":
      return "px-2 py-0.5 text-[10px]";
    case "md":
      return "px-2.5 py-1 text-xs";
    case "lg":
      return "px-3 py-1.5 text-sm";
    default:
      return "px-2.5 py-1 text-xs";
  }
}
