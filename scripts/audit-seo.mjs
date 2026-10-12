// Auditoría local de SEO. Ejecutar con: node scripts/audit-seo.mjs
// Requiere que npm run start esté ejecutándose en localhost:3000.
const base = process.env.SEO_AUDIT_URL || "http://localhost:3000";
const site = "https://www.melocotonmove.com";
const decode = (s = "") => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = (html, tag) => decode(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() || "");
const meta = (html, key) => decode(html.match(new RegExp(`<meta\\s+[^>]*name=["']${key}["'][^>]*>`, "i"))?.[0]?.match(/content=["']([^"']*)["']/i)?.[1] || "");
const canonical = (html) => decode(html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']*)["']/i)?.[1] || "");
const errors = [];
const titles = new Map();
let total = 0;
let products = 0;
try {
  const response = await fetch(base + "/sitemap.xml");
  if (!response.ok) throw new Error("sitemap.xml HTTP " + response.status);
  const xml = await response.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1].replace(/&amp;/g, "&")).pathname);
  if (!paths.length) throw new Error("Sitemap sin URLs");
  for (const path of new Set(paths)) {
    total++;
    let html;
    try {
      const res = await fetch(base + path);
      if (!res.ok) { errors.push(`${path}: HTTP ${res.status}`); continue; }
      html = await res.text();
    } catch (err) { errors.push(`${path}: ${err.message}`); continue; }
    const title = text(html, "title");
    const description = meta(html, "description");
    const url = canonical(html);
    if (!title) errors.push(`${path}: falta title`);
    else if (titles.has(title)) errors.push(`${path}: título repetido con ${titles.get(title)}`);
    else titles.set(title, path);
    if (!description) errors.push(`${path}: falta meta description`);
    if (url !== site + (path === "/" ? "/" : path)) errors.push(`${path}: canonical incorrecta: ${url}`);
    const isProduct = !["/", "/products", "/aboutus", "/contact", "/arma-tu-studio", "/crea-tu-mat", "/tapetes-yoga-pilates", "/calcetines-antideslizantes-pilates", "/guia-elegir-tapete-yoga-pilates", "/guia-calcetas-antideslizantes-pilates"].includes(path);
    if (isProduct) {
      products++;
      const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      const structured = [];
      for (const m of scripts) {
        try { structured.push(JSON.parse(m[1])); }
        catch { errors.push(`${path}: JSON-LD inválido`); }
      }
      const product = structured.find((x) => x["@type"] === "Product");
      const breadcrumb = structured.find((x) => x["@type"] === "BreadcrumbList");
      if (!product) errors.push(`${path}: falta JSON-LD Product`);
      else {
        if (product.offers?.url !== site + path) errors.push(`${path}: URL de oferta incorrecta`);
        if (!product.name) errors.push(`${path}: Product sin nombre`);
        if (product.category === "Calcetas antideslizantes para Pilates") {
          if (product.size !== "Unitalla") errors.push(`${path}: calcetas sin talla unitalla en Product JSON-LD`);
          if (!html.includes("Talla: Unitalla.")) errors.push(`${path}: calcetas sin talla visible en la ficha`);
        }
      }
      if (!breadcrumb) errors.push(`${path}: falta JSON-LD BreadcrumbList`);
    }
  }
  console.log(`Auditadas ${total} URLs (${products} fichas detectadas).`);
  if (errors.length) {
    console.error(`Se encontraron ${errors.length} incidencias:\n- ${errors.join("\n- ")}`);
    process.exitCode = 1;
  } else console.log("Sin incidencias en los controles automatizados.");
} catch (error) {
  console.error("No se pudo ejecutar la auditoría:", error.message);
  process.exitCode = 1;
}
