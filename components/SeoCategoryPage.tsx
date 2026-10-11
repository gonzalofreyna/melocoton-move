import Head from "next/head";
import Link from "next/link";
import { resolveImage } from "../lib/resolveImage";
import type { Product } from "../lib/fetchProducts";

export type SeoCategoryProps = { products: Product[] };

type Props = SeoCategoryProps & {
  title: string;
  description: string;
  heading: string;
  intro: string;
  canonicalPath: string;
};

export default function SeoCategoryPage({
  products, title, description, heading, intro, canonicalPath,
}: Props) {
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
                  <Link key={product.slug} href={`/${product.slug}`} className="rounded-2xl bg-white p-4 shadow-sm hover:shadow-md">
                    <div className="aspect-square flex items-center justify-center">
                      <img src={resolveImage(product.image)} alt={product.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                    </div>
                    <h2 className="mt-4 text-center font-semibold text-brand-blue">{product.name}</h2>
                    <p className="mt-2 text-center text-brand-blue">
                      {(product.discountPrice ?? product.fullPrice).toLocaleString("es-MX", {style:"currency",currency:"MXN"})}
                    </p>
                    {variants.length > 1 && <p className="mt-1 text-center text-sm text-gray-500">{variants.length} opciones disponibles</p>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
