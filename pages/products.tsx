// pages/products.tsx
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
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

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, typeof filteredProducts>();

    filteredProducts.forEach((product) => {
      const key = product.name.trim().toLowerCase().replace(/\s+/g, " ");

      const currentGroup = groups.get(key) ?? [];
      currentGroup.push(product);
      groups.set(key, currentGroup);
    });

    return Array.from(groups.values());
  }, [filteredProducts]);

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
    <>
      <Head>
        <title>Productos de Pilates y Yoga | Melocotón Move</title>
        <meta
          name="description"
          content="Explora calcetines antideslizantes, tapetes de yoga y accesorios de Pilates en Melocotón Move. Descubre nuestra colección."
        />
        <link rel="canonical" href="https://www.melocotonmove.com/products" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-brand-cream px-4 py-12 sm:px-6 sm:py-20">
      <h1 className="mm-heading mb-6 text-center text-4xl sm:text-5xl">
        {title}
      </h1>
      {/* Estos enlaces se prerenderizan aunque el catálogo cargue en el navegador. */}
      <nav
        aria-label="Explora nuestras categorías de Pilates y yoga"
        className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:mb-12 sm:text-sm"
      >
        <Link className="mm-text-link" href="/tapetes-yoga-pilates">Tapetes de yoga y Pilates</Link>
        <Link className="mm-text-link" href="/calcetines-antideslizantes-pilates">Calcetas antideslizantes</Link>
        <Link className="mm-text-link" href="/crea-tu-mat">Personaliza tu mat</Link>
      </nav>
      {isLoading && <p className="text-gray-500">Cargando productos…</p>}
      {anyError && !isLoading && (
        <div className="text-center space-y-2">
          {productsError && <p className="text-red-600">{productsError}</p>}
          {configError && <p className="text-red-600">{configError}</p>}
        </div>
      )}

      {!isLoading && !anyError && (
        <>
          {groupedProducts.length === 0 ? (
            <p className="text-gray-500 text-center">
              No se encontraron productos.
            </p>
          ) : (
            <div className="grid w-full max-w-7xl grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {groupedProducts.map((variants) => {
                const product = variants[0];

                return (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    variants={variants}
                    offerBadge={config!.offerBadge}
                    featureFlags={config!.featureFlags}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
      <p className="mt-12 max-w-3xl text-center text-sm leading-7 text-brand-muted sm:mt-16 sm:text-base">
        Explora nuestra selección de tapetes de yoga y Pilates, calcetas antideslizantes
        para reformer y barre y accesorios para practicar en casa o en el estudio.
        Consulta los colores, las características y la disponibilidad de cada producto.
      </p>
      <section aria-labelledby="catalogo-guia-compra" className="mt-16 w-full max-w-4xl border-t border-brand-line pt-8 text-left sm:mt-20 sm:pt-10">
        <h2 id="catalogo-guia-compra" className="mm-heading text-2xl sm:text-3xl">
          Encuentra lo que necesitas para tu práctica
        </h2>
        <p className="mm-copy mt-4">
          Nuestros tapetes profesionales combinan una base de caucho natural y una superficie
          de poliuretano de alto grado. Puedes explorar diferentes formas, como bala,
          cápsula y clásica, y conocer las opciones de personalización con grabado láser.
          Las calcetas antideslizantes están pensadas para acompañar sesiones de Pilates,
          reformer y barre: consulta el modelo y las características de cada variante.
        </p>
        <p className="mm-copy mt-3">
          También encontrarás accesorios para Pilates y entrenamiento funcional,
          como mini balls y magic rings. Revisa las fichas para comparar materiales,
          dimensiones, colores y precios vigentes antes de elegir. Si buscas personalizar
          un mat para tu práctica o tu estudio, puedes comenzar desde una sola pieza.
        </p>
      </section>
    </main>
    </>
  );
}
