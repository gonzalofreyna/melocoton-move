// components/ProductCard.tsx
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const finalPrice = product.discountPrice ?? product.fullPrice;
  const img = resolveImage(product.image);

  return (
    <div className="relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-transform transform hover:scale-105">
      {/* Badge de oferta */}
      {typeof product.discountPrice === "number" && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
          Promoción
        </div>
      )}

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
