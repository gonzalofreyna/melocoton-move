import Head from "next/head";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductsContext";
import { useAppConfig } from "../context/ConfigContext";
import type { OfferBadgeConfig, AppConfig } from "../lib/fetchConfig";
import type { Product } from "../lib/fetchProducts";

export type SeoCategoryProps = { products: Product[] };

type Props = SeoCategoryProps & {
  title: string;
  description: string;
  heading: string;
  intro: string;
  canonicalPath: string;
  productCategory: "mat" | "calcetas";
  contentSections?: { heading: string; body: string }[];
  faqs?: { question: string; answer: string }[];
  guide?: { href: string; title: string; description: string };
  customizer?: { href: string; title: string; description: string };
};

export default function SeoCategoryPage({
  products, title, description, heading, intro, canonicalPath, productCategory, contentSections = [], faqs = [], guide, customizer,
}: Props) {
  const { config } = useAppConfig();
  const { products: liveProducts, loading: liveLoading, error: liveError } = useProducts();
  const offerBadge = config?.offerBadge ?? ({ enabled: false } as OfferBadgeConfig);
  const featureFlags = config?.featureFlags ?? ({} as AppConfig["featureFlags"]);
  // Los productos pre-renderizados mantienen SEO y la carga inicial.
  // En cuanto responde la API en el navegador, precios/stock/variantes se
  // toman de la misma fuente actualizada que usan /products y el carrito.
  const displayProducts = !liveLoading && !liveError
    ? liveProducts.filter((item) => item.category.trim().toLowerCase() === productCategory)
    : products;
  const groups = new Map<string, Product[]>();
  for (const product of displayProducts) {
    const key = product.name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  // JSON-LD de categoría construido con los mismos grupos que se muestran
  // visualmente. No se generan URL ni productos ficticios.
  const siteUrl = "https://www.melocotonmove.com";
  const grouped = [...groups.values()];
  const listingLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}${canonicalPath}#collection`,
    url: `${siteUrl}${canonicalPath}`,
    name: heading,
    description,
    inLanguage: "es-MX",
    mainEntity: {
      "@type": "ItemList",
      // Enumerar todas las variantes reales, no solo la primera tarjeta de cada grupo.
      itemListElement: grouped.flatMap((variants) => variants).map((variant, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: variant.name,
        url: `${siteUrl}/${variant.slug}`,
      })),
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: heading, item: `${siteUrl}${canonicalPath}` },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}${canonicalPath}`} />
        <meta property="og:locale" content="es_MX" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      </Head>
      <main className="min-h-screen bg-brand-cream px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mm-heading text-center text-3xl sm:text-5xl">{heading}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base">{intro}</p>
          {productCategory === "mat" && (
            <div className="mm-card mx-auto mt-8 max-w-3xl px-4 py-5 text-center sm:px-6">
              <p className="text-sm leading-6 text-gray-700">
                ¿Quieres ver más de Melocotón Move en movimiento?
              </p>
              <Link href="/melocoton-en-movimiento" className="mt-2 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-blue underline underline-offset-4">
                Descubre nuestras historias en video →
              </Link>
            </div>
          )}
          {groups.size === 0 ? (
            <p className="mt-12 text-center text-gray-600">No hay productos disponibles en esta categoría por el momento.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {grouped.map((variants) => {
                const product = variants[0];
                return (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    variants={variants}
                    offerBadge={offerBadge}
                    featureFlags={featureFlags}
                  />
                );
              })}
            </div>
          )}
          {contentSections.length > 0 && (
            <section aria-label="Guía de compra" className="mx-auto mt-12 max-w-4xl border-t border-gray-200 pt-8 sm:mt-16 sm:pt-10">
              <h2 className="text-xl leading-snug sm:text-2xl font-bold text-brand-blue">Encuentra el producto ideal para tu práctica</h2>
              <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-8 md:grid-cols-2">
                {contentSections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="text-base leading-snug sm:text-lg font-semibold text-brand-blue">{section.heading}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">{section.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {customizer && (
            <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-brand-line bg-brand-sand p-5 sm:mt-10 sm:p-7">
              <h2 className="text-lg font-semibold leading-snug text-brand-blue sm:text-xl">{customizer.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-700 sm:text-base">{customizer.description}</p>
              <Link className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-blue underline underline-offset-4" href={customizer.href}>Diseñar mi mat personalizado</Link>
            </section>
          )}
          {guide && (
            <section className="mm-card mx-auto mt-8 max-w-4xl p-5 sm:mt-10 sm:p-7">
              <h2 className="text-lg leading-snug font-semibold text-brand-blue sm:text-xl">{guide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">{guide.description}</p>
              <Link className="mm-button mt-5 w-full sm:w-auto" href={guide.href}>Leer la guía completa</Link>
            </section>
          )}
          {faqs.length > 0 && (
            <section aria-labelledby="category-faq-title" className="mx-auto mt-10 max-w-4xl border-t border-gray-200 pt-8 sm:mt-12 sm:pt-10">
              <h2 id="category-faq-title" className="mm-heading text-2xl sm:text-3xl">Preguntas frecuentes</h2>
              <div className="mt-5 space-y-3">
                {faqs.map(({ question, answer }) => (
                  <details key={question} className="group rounded-2xl border border-brand-line bg-white px-4 py-1 sm:px-5">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold leading-6 text-brand-blue marker:content-none sm:text-base [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="shrink-0 text-xl font-normal group-open:rotate-45">+</span></summary>
                    <p className="pb-4 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
