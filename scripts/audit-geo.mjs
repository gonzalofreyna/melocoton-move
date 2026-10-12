// Verifica el HTML de la fase GEO sin depender de un navegador.
// Ejecutar después de npm run build && npm run start:
// node scripts/audit-geo.mjs
const base = process.env.GEO_AUDIT_URL || "http://localhost:3000";
const checks = [
  { path: "/", required: ["Descubre Melocotón Move: yoga", "Ver tapetes de yoga y Pilates", "Ver calcetas antideslizantes", "Personalizar mi mat"], schema: "Organization" },
  { path: "/aboutus", required: ["¿Qué es Melocotón Move?", "tapetes de yoga y Pilates", "calcetas antideslizantes"] },
  { path: "/tapetes-yoga-pilates", required: ["Preguntas frecuentes", "¿Qué grosor tienen los tapetes?", "/guia-elegir-tapete-yoga-pilates", "/crea-tu-mat", "Diseñar mi mat personalizado"] },
  { path: "/calcetines-antideslizantes-pilates", required: ["Preguntas frecuentes", "¿Se pueden usar para Pilates reformer y barre?", "¿Dónde comprar calcetas antideslizantes para Pilates en México?", "modelos Basic y Curly", "/guia-calcetas-antideslizantes-pilates"] },
  { path: "/guia-elegir-tapete-yoga-pilates", required: ["Cómo elegir un tapete de yoga y Pilates", "Revisa los materiales", "/tapetes-yoga-pilates", "Diseñar mi tapete personalizado", "/crea-tu-mat"] },
  { path: "/guia-calcetas-antideslizantes-pilates", required: ["Cómo elegir calcetas antideslizantes para Pilates", "Comprueba el agarre", "Dónde comprar calcetas para Pilates en México", "/calcetines-antideslizantes-pilates"] },
  { path: "/crea-tu-mat", required: ["Desde una sola pieza", "Personalización láser", "Tapetes de yoga y Pilates personalizados con tu logo en México", "/tapetes-yoga-pilates"] },
];
const errors = [];
const read = async (path) => {
  const response = await fetch(base + path);
  if (!response.ok) throw new Error("HTTP " + response.status);
  return response.text();
};
for (const { path, required, schema } of checks) {
  try {
    const html = await read(path);
    // Evita falsos positivos de contenido que existe solo en scripts o datos de hidratación.
    const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
    for (const value of required) {
      if (!visibleHtml.includes(value)) errors.push(path + ": falta contenido HTML visible " + value);
    }
    if (schema) {
      const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      let valid = false;
      for (const item of scripts) {
        try {
          const data = JSON.parse(item[1]);
          if (data["@type"] === schema && data.name === "Melocotón Move" && data.url === "https://www.melocotonmove.com/") valid = true;
        } catch { errors.push(path + ": JSON-LD inválido"); }
      }
      if (!valid) errors.push(path + ": falta Organization JSON-LD válido");
    }
    if (path === "/") {
      const ldScripts = [...html.matchAll(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>([\s\S]*?)<\/script>/gi)];
      const ldItems = ldScripts.flatMap((match) => {
        try { return [JSON.parse(match[1])]; } catch { return []; }
      });
      const website = ldItems.find((item) => item["@type"] === "WebSite");
      if (website?.potentialAction?.target !== "https://www.melocotonmove.com/products?search={search_term_string}") {
        errors.push("/: WebSite SearchAction apunta a una ruta incorrecta");
      }
      const organizations = ldItems.filter((item) => item["@type"] === "Organization");
      if (organizations.length !== 1) errors.push("/: debe haber una sola Organization JSON-LD");
    }
    if (path.startsWith("/guia-") || path === "/crea-tu-mat") {
      const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      const breadcrumbs = scripts.flatMap((match) => {
        try { return [JSON.parse(match[1])]; } catch { return []; }
      }).find((item) => item["@type"] === "BreadcrumbList");
      if (!breadcrumbs || breadcrumbs.itemListElement?.length !== 3) errors.push(path + ": falta BreadcrumbList completo");
    }
    console.log("OK", path);
  } catch (error) { errors.push(path + ": " + error.message); }
}
try {
  const robots = await read("/robots.txt");
  if (!robots.includes("User-agent: *") || !robots.includes("Allow: /")) errors.push("robots.txt: faltan reglas públicas");
  for (const item of checks) {
    if (robots.includes("Disallow: " + item.path + "\n")) errors.push("robots.txt: bloqueada " + item.path);
  }
  const sitemap = await read("/sitemap.xml");
  for (const slug of ["/guia-elegir-tapete-yoga-pilates", "/guia-calcetas-antideslizantes-pilates"]) {
    if (!sitemap.includes("https://www.melocotonmove.com" + slug + "</loc>")) errors.push("sitemap: falta " + slug);
  }
  console.log("OK robots.txt y sitemap");
} catch (error) { errors.push("robots/sitemap: " + error.message); }
if (errors.length) {
  console.error("Incidencias GEO (" + errors.length + "):\n- " + errors.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Auditoría GEO local superada: ${checks.length} páginas, robots.txt y sitemap.`);
}
