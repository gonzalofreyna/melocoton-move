import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import { resolveImage } from "../lib/resolveImage";

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos desde S3
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setAllProducts(data);
      } catch (e) {
        console.error("Error cargando productos en ProductDetail", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Normaliza slug y busca el producto
  const product = useMemo(() => {
    if (!slug || !Array.isArray(allProducts)) return undefined;
    const s = String(slug).toLowerCase();
    return allProducts.find((p) => p.slug.toLowerCase() === s);
  }, [slug, allProducts]);

  if (loading || !slug) {
    return <p className="text-center py-20">Cargando producto…</p>;
  }

  if (!product) {
    return <p className="text-center py-20">Producto no encontrado.</p>;
  }

  const finalPrice = product.discountPrice ?? product.fullPrice;
  const img = resolveImage(product.image);

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Imagen */}
        <div className="bg-white rounded-2xl p-6 shadow-md flex items-center justify-center">
          <img
            src={img}
            alt={product.name}
            className="max-h-[400px] object-contain"
          />
        </div>

        {/* Detalles */}
        <div className="flex flex-col justify-center space-y-4">
          <h1 className="text-3xl font-bold text-brand-blue">{product.name}</h1>

          {product.description && (
            <p className="text-gray-600 whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Colores */}
          {!!product.colors?.length && (
            <div className="flex items-center gap-2 mt-2">
              {product.colors.map((color, idx) => (
                <span
                  key={idx}
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Precio */}
          <div>
            {typeof product.discountPrice === "number" ? (
              <>
                <p className="text-brand-blue font-bold text-xl">
                  ${product.discountPrice} MXN
                </p>
                <p className="text-gray-400 line-through">
                  ${product.fullPrice} MXN
                </p>
              </>
            ) : (
              <p className="text-brand-beige font-bold text-xl">
                ${product.fullPrice} MXN
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            onClick={() =>
              addToCart({
                name: product.name,
                image: img,
                price: finalPrice,
              })
            }
            className="bg-brand-blue text-white py-3 px-6 rounded-xl hover:bg-brand-beige hover:text-brand-blue transition-colors"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </main>
  );
}
