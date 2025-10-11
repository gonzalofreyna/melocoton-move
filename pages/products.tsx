// pages/products.tsx
import { useRouter } from "next/router";
import { useMemo } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { useAppConfig } from "../context/ConfigContext";

export default function ProductsPage() {
  const router = useRouter();
  const { category, search, onSale, popular, freeShipping, sort } =
    router.query;

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const { config, loading: configLoading, error: configError } = useAppConfig();

  const q = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const categoryString = decodeURIComponent((q(category) ?? "").toLowerCase());
  const searchString = (q(search) ?? "").toLowerCase();
  const sortParam = (q(sort) ?? "").toLowerCase();

  // Soporta flags directos y sort=...
  const onSaleParam =
    q(onSale) === "1" ||
    categoryString === "ofertas" ||
    sortParam === "best-deals" ||
    sortParam === "sale" ||
    sortParam === "ofertas";

  const popularParam = q(popular) === "1" || sortParam === "popular";

  const freeShippingParam =
    q(freeShipping) === "1" ||
    sortParam === "free-shipping" ||
    sortParam === "envio-gratis";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        categoryString && categoryString !== "ofertas" && !onSaleParam
          ? product.category.toLowerCase() === categoryString
          : true;

      const matchesSearch = searchString
        ? product.name.toLowerCase().includes(searchString)
        : true;

      const matchesOnSale = onSaleParam
        ? typeof product.discountPrice === "number"
        : true;

      const matchesPopular = popularParam ? product.featured === true : true;

      const matchesFreeShipping = freeShippingParam
        ? product.freeShipping === true
        : true;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesOnSale &&
        matchesPopular &&
        matchesFreeShipping
      );
    });
  }, [
    products,
    categoryString,
    searchString,
    onSaleParam,
    popularParam,
    freeShippingParam,
  ]);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const title = searchString
    ? `Resultados para "${q(search)}"`
    : onSaleParam
    ? "Mejores ofertas"
    : popularParam
    ? "Populares"
    : freeShippingParam
    ? "Envío gratis"
    : categoryString
    ? cap(categoryString)
    : "Nuestros Productos";

  const isLoading = productsLoading || configLoading;
  const anyError = productsError || configError;

  return (
    <main className="flex flex-col items-center px-6 py-16 bg-gray-50 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-blue mb-12">
        {title}
      </h1>

      {isLoading && <p className="text-gray-500">Cargando productos…</p>}
      {anyError && !isLoading && (
        <div className="text-center space-y-2">
          {productsError && <p className="text-red-600">{productsError}</p>}
          {configError && <p className="text-red-600">{configError}</p>}
        </div>
      )}

      {!isLoading && !anyError && (
        <>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500 text-center">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full max-w-7xl">
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
