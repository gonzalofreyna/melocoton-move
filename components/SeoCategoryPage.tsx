import Head from "next/head";
import Link from "next/link";
import ProductCard from "./ProductCard";
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
  contentSections?: { heading: string; body: string }[];
  faqs?: { question: string; answer: string }[];
  guide?: { href: string; title: string; description: string };
};

export default function SeoCategoryPage({
  products, title, description, heading, intro, canonicalPath, contentSections = [], faqs = [], guide,
}: Props) {
  const { config } = useAppConfig();
  const offerBadge = config?.offerBadge ?? ({ enabled: false } as OfferBadgeConfig);
  const featureFlags = config?.featureFlags ?? ({} as AppConfig["featureFlags"]);
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.melocotonmove.com${canonicalPath}`} />
      </Head>
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl leading-tight sm:text-4xl font-bold text-brand-blue text-center">{heading}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base">{intro}</p>
          {groups.size === 0 ? (
            <p className="mt-12 text-center text-gray-600">No hay productos disponibles en esta categoría por el momento.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {[...groups.values()].map((variants) => {
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
          {guide && (
            <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:mt-10 sm:p-7">
              <h2 className="text-lg leading-snug font-semibold text-brand-blue sm:text-xl">{guide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">{guide.description}</p>
              <Link className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-blue px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-beige hover:text-brand-blue sm:inline-flex sm:w-auto" href={guide.href}>Leer la guía completa</Link>
            </section>
          )}
          {faqs.length > 0 && (
            <section aria-labelledby="category-faq-title" className="mx-auto mt-10 max-w-4xl border-t border-gray-200 pt-8 sm:mt-12 sm:pt-10">
              <h2 id="category-faq-title" className="text-xl font-bold text-brand-blue sm:text-2xl">Preguntas frecuentes</h2>
              <div className="mt-5 space-y-3">
                {faqs.map(({ question, answer }) => (
                  <details key={question} className="group rounded-xl border border-gray-200 bg-white px-4 py-1 sm:px-5">
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
