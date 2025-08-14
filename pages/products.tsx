import { useRouter } from "next/router";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../lib/fetchProducts";
import { useEffect, useState } from "react";
import type { Product } from "../lib/fetchProducts";
import { fetchConfig } from "../lib/fetchConfig";
import type { AppConfig } from "../lib/fetchConfig";

export default function ProductsPage() {
  const router = useRouter();
  const { category, search } = router.query;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<null | string>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configErr, setConfigErr] = useState<null | string>(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, cfg] = await Promise.all([fetchProducts(), fetchConfig()]);
        setProducts(data);
        setConfig(cfg);
      } catch (e) {
        setErr((prev) => prev ?? "No se pudieron cargar los productos.");
        setConfigErr((prev) => prev ?? "No se pudo cargar la configuración.");
        console.error(e);
      } finally {
        setLoading(false);
        setConfigLoading(false);
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

  const isLoading = loading || configLoading;
  const anyError = err || configErr;

  return (
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-blue mb-12">
        {title}
      </h1>

      {isLoading && <p className="text-gray-500">Cargando productos…</p>}
      {anyError && !isLoading && (
        <div className="text-center space-y-2">
          {err && <p className="text-red-600">{err}</p>}
          {configErr && <p className="text-red-600">{configErr}</p>}
        </div>
      )}

      {!isLoading && !anyError && (
        <>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-7xl">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  offerBadge={config!.offerBadge}
                  featureFlags={config!.featureFlags}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
