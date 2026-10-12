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
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-blue text-center">{heading}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-center text-gray-600">{intro}</p>
          {groups.size === 0 ? (
            <p className="mt-12 text-center text-gray-600">No hay productos disponibles en esta categoría por el momento.</p>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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
            <section aria-label="Guía de compra" className="mx-auto mt-16 max-w-4xl border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-bold text-brand-blue">Encuentra el producto ideal para tu práctica</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {contentSections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="text-lg font-semibold text-brand-blue">{section.heading}</h3>
                    <p className="mt-2 leading-relaxed text-gray-600">{section.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {guide && (
            <section className="mx-auto mt-10 max-w-4xl rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-brand-blue">{guide.title}</h2>
              <p className="mt-2 text-gray-600">{guide.description}</p>
              <Link className="mt-4 inline-block font-semibold text-brand-blue underline" href={guide.href}>Leer la guía completa</Link>
            </section>
          )}
          {faqs.length > 0 && (
            <section aria-labelledby="category-faq-title" className="mx-auto mt-12 max-w-4xl border-t border-gray-200 pt-10">
              <h2 id="category-faq-title" className="text-2xl font-bold text-brand-blue">Preguntas frecuentes</h2>
              <div className="mt-5 divide-y divide-gray-200">
                {faqs.map(({ question, answer }) => (
                  <details key={question} className="py-4" open>
                    <summary className="cursor-pointer font-semibold text-brand-blue">{question}</summary>
                    <p className="mt-2 leading-relaxed text-gray-600">{answer}</p>
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
