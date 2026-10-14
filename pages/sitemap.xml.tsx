import type { GetServerSideProps } from "next";
import { customerVideos, customerVideoSource, customerVideoPoster } from "../lib/customerVideos";

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
    "/tapetes-yoga-pilates",
    "/calcetines-antideslizantes-pilates",
    "/aboutus",
    "/contact",
    "/arma-tu-studio",
    "/crea-tu-mat",
    "/melocoton-en-movimiento",
    "/guia-elegir-tapete-yoga-pilates",
    "/guia-calcetas-antideslizantes-pilates",
  ]);

  try {
    // Consulta el mismo catálogo que utiliza la tienda para encontrar slugs reales.
    const { fetchProducts } = await import("../lib/fetchProducts");
    const products = await fetchProducts({ fresh: true });
    for (const product of products) {
      if (product.slug && !product.slug.includes("/")) {
        urls.add("/" + encodeURIComponent(product.slug));
      }
    }
  } catch (error) {
    // No perder el sitemap de páginas estáticas si la API del catálogo falla.
    console.error("No se pudieron incluir productos en sitemap.xml", error);
  }

  // Los 9 videos se anuncian en una sola URL con el protocolo de video sitemap.
  // No inventar fechas, duración ni descripciones de escenas no verificadas.
  const videoEntries = customerVideos.map(({ id, title }) =>
    `    <video:video>
      <video:thumbnail_loc>${escapeXml(customerVideoPoster(id))}</video:thumbnail_loc>
      <video:title>${escapeXml(title + " | Melocotón Move")}</video:title>
      <video:description>${escapeXml("Video de la colección audiovisual Melocotón en movimiento de Melocotón Move.")}</video:description>
      <video:content_loc>${escapeXml(customerVideoSource(id))}</video:content_loc>
    </video:video>`
  ).join("\n");

  const entries = [...urls]
    .map((path) => path === "/melocoton-en-movimiento"
      ? `  <url><loc>${escapeXml(SITE_URL + path)}</loc>
${videoEntries}
  </url>`
      : `  <url><loc>${escapeXml(SITE_URL + path)}</loc></url>`)
    .join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
  res.write(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries}\n</urlset>`);
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
