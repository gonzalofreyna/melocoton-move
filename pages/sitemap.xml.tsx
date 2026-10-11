import type { GetServerSideProps } from "next";

const SITE_URL = "https://www.melocotonmove.com";

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char];
  });
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // La portada y estas secciones existen sin depender del catálogo.
  const urls = new Set([
    "/",
    "/products",
    "/aboutus",
    "/contact",
    "/arma-tu-studio",
    "/crea-tu-mat",
  ]);

  try {
    // Consulta el mismo catálogo que utiliza la tienda para encontrar slugs reales.
    const { fetchProducts } = await import("../lib/fetchProducts");
    const products = await fetchProducts();
    for (const product of products) {
      if (product.slug && !product.slug.includes("/")) {
        urls.add("/" + encodeURIComponent(product.slug));
      }
    }
  } catch (error) {
    // No perder el sitemap de páginas estáticas si la API del catálogo falla.
    console.error("No se pudieron incluir productos en sitemap.xml", error);
  }

  const entries = [...urls]
    .map((path) => `  <url><loc>${escapeXml(SITE_URL + path)}</loc></url>`)
    .join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  res.write(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
