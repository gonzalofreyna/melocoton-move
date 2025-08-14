import { useRouter } from "next/router";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../lib/fetchProducts";
import { useEffect, useState } from "react";
import type { Product } from "../lib/fetchProducts";

export default function ProductsPage() {
  const router = useRouter();
  const { category, search } = router.query;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<null | string>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (e) {
        setErr("No se pudieron cargar los productos.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryString = decodeURIComponent(
    String(category || "")
  ).toLowerCase();
  const searchString = String(search || "").toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      categoryString === "ofertas"
        ? typeof product.discountPrice === "number"
        : category
        ? product.category.toLowerCase() === categoryString
        : true;

    const matchesSearch = search
      ? product.name.toLowerCase().includes(searchString)
      : true;

    return matchesCategory && matchesSearch;
  });

  const title = search
    ? `Resultados para "${search}"`
    : categoryString === "ofertas"
    ? "Ofertas"
    : category
    ? categoryString.charAt(0).toUpperCase() + categoryString.slice(1)
    : "Nuestros Productos";

  return (
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-blue mb-12">
        {title}
      </h1>

      {loading && <p className="text-gray-500">Cargando productos…</p>}
      {err && !loading && <p className="text-red-600">{err}</p>}

      {!loading && !err && (
        <>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-7xl">
              {filteredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
