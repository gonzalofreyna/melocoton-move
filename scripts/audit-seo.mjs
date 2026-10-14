// Auditoría local de SEO. Ejecutar con: node scripts/audit-seo.mjs
// Requiere que npm run start esté ejecutándose en localhost:3000.
const base = process.env.SEO_AUDIT_URL || "http://localhost:3000";
const site = "https://www.melocotonmove.com";
const decode = (s = "") => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// Extrae texto visible del HTML prerenderizado. React intercala comentarios
// <!-- --> al renderizar un valor dinámico junto a texto (ej. 1399.00<!-- --> MXN).
// Buscar en HTML crudo provoca un falso positivo por cada producto.
const visibleText = (html) => decode(
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/\s+/g, " ")
    .trim(),
);

const text = (html, tag) => decode(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() || "");
const meta = (html, key) => decode(html.match(new RegExp(`<meta\\s+[^>]*name=["']${key}["'][^>]*>`, "i"))?.[0]?.match(/content=["']([^"']*)["']/i)?.[1] || "");
const canonical = (html) => decode(html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']*)["']/i)?.[1] || "");
const errors = [];
const warnings = [];
let liveBySlug = null;
const validPrice = (full, discount) => {
  const regular = Number(full);
  const sale = discount == null ? NaN : Number(discount);
  return Number.isFinite(sale) && sale > 0 && Number(sale.toFixed(2)) < Number(regular.toFixed(2))
    ? sale : regular;
};
const almostEqual = (a, b) => Number.isFinite(Number(a)) && Number.isFinite(Number(b))
  && Math.abs(Number(a) - Number(b)) < 0.011;
const titles = new Map();
let total = 0;
let products = 0;
try {
  // Comparación opcional con catálogo vivo. Diferencias: alerta, no error,
  // porque el HTML puede estar dentro de la ventana ISR de 30 minutos.
  const apiUrl = process.env.NEXT_PUBLIC_API_PRODUCTS_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      url.searchParams.set("v", String(Date.now()));
      const liveResponse = await fetch(url, { cache: "no-store" });
      if (!liveResponse.ok) throw new Error("HTTP " + liveResponse.status);
      const items = await liveResponse.json();
      if (!Array.isArray(items)) throw new Error("La API no devolvió una lista");
      liveBySlug = new Map(items.filter((p) => typeof p.slug === "string")
        .map((p) => [p.slug.toLowerCase(), p]));
    } catch (error) {
      warnings.push("API actual: no fue posible comparar el catálogo (" + error.message + ")");
    }
  } else {
    console.log("Comparación API omitida: ejecuta node --env-file=.env.local scripts/audit-seo.mjs");
  }
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
    const isProduct = !["/", "/products", "/aboutus", "/contact", "/arma-tu-studio", "/crea-tu-mat", "/melocoton-en-movimiento", "/tapetes-yoga-pilates", "/calcetines-antideslizantes-pilates", "/guia-elegir-tapete-yoga-pilates", "/guia-calcetas-antideslizantes-pilates"].includes(path);
    // Las categorías exponen los mismos productos del catálogo prerenderizado.
    if (path === "/tapetes-yoga-pilates" || path === "/calcetines-antideslizantes-pilates") {
      const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
        .flatMap((match) => { try { return [JSON.parse(match[1])]; } catch { return []; } });
      const collection = jsonLd.find((value) => value["@type"] === "CollectionPage");
      const crumbs = jsonLd.find((value) => value["@type"] === "BreadcrumbList");
      if (!collection || collection.mainEntity?.["@type"] !== "ItemList") {
        errors.push(path + ": falta CollectionPage e ItemList");
      } else {
        const entries = collection.mainEntity.itemListElement || [];
        if (!entries.length) errors.push(path + ": ItemList sin productos");
        const urls = new Set();
        for (const [index, entry] of entries.entries()) {
          if (entry["@type"] !== "ListItem" || entry.position !== index + 1 ||
              !entry.name?.trim() || !entry.url?.startsWith(site + "/") || urls.has(entry.url)) {
            errors.push(path + ": item de colección inválido o duplicado");
            break;
          }
          urls.add(entry.url);
        }
      }
      if (!crumbs || crumbs.itemListElement?.length !== 2 ||
          crumbs.itemListElement[1]?.item !== site + path) {
        errors.push(path + ": BreadcrumbList de categoría incorrecto");
      }
    }
    if (path === "/products") {
      for (const url of ["/tapetes-yoga-pilates", "/calcetines-antideslizantes-pilates", "/crea-tu-mat"]) {
        if (!html.includes(`href="${url}"`)) errors.push(path + ": falta enlace SSR a " + url);
      }
    }
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
      const hydration = html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      let initialProduct;
      try {
        initialProduct = hydration && JSON.parse(hydration[1])?.props?.pageProps?.initialProduct;
      } catch {
        errors.push(path + ": datos de hidratación inválidos");
      }
      if (!initialProduct) {
        errors.push(path + ": ficha de catálogo ausente del HTML inicial");
      } else if (product) {
        const price = validPrice(initialProduct.fullPrice, initialProduct.discountPrice);
        if (!Number.isFinite(price) || price <= 0) warnings.push(path + ": revisar precio base (no positivo)");
        if (product.offers?.priceCurrency !== "MXN") errors.push(path + ": moneda JSON-LD incorrecta");
        if (!almostEqual(product.offers?.price, price)) errors.push(path + ": precio JSON-LD diferente del producto inicial");
        if (!visibleText(html).includes(price.toFixed(2) + " MXN")) errors.push(path + ": precio no visible en el HTML inicial");
        if (initialProduct.category === "mat" && /^Mat Profesional\b/i.test(initialProduct.name)) {
          const seoTitle = text(html, "title");
          if (!seoTitle.includes("Tapete Yoga y Pilates")) errors.push(path + ": título de mat sin intención de búsqueda Yoga y Pilates");
        }
        const h1 = text(html, "h1");
        if (!h1 || h1 !== product.name) errors.push(path + ": H1 y nombre JSON-LD diferentes");
        if (breadcrumb?.itemListElement?.[2]?.name !== product.name) errors.push(path + ": breadcrumb sin nombre de variante correcto");
        if (!product.brand?.name?.trim()) errors.push(path + ": marca sin nombre");
        const expectedColor = initialProduct.colors?.length ? initialProduct.colors.join(", ") : undefined;
        const expectedMaterial = initialProduct.materials?.length ? initialProduct.materials.join(", ") : undefined;
        const expectedWeight = typeof initialProduct.weightGrams === "number" && initialProduct.weightGrams > 0
          ? initialProduct.weightGrams : undefined;
        if (product.color !== expectedColor) errors.push(path + ": color JSON-LD distinto del catálogo");
        if (product.material !== expectedMaterial) errors.push(path + ": materiales JSON-LD distintos del catálogo");
        if (product.weight?.value !== expectedWeight ||
            (expectedWeight != null && product.weight?.unitCode !== "GRM")) {
          errors.push(path + ": peso JSON-LD distinto del catálogo");
        }
        const initialRelated = (() => {
          try { return JSON.parse(hydration[1])?.props?.pageProps?.initialRelated; }
          catch { return null; }
        })();
        if (!Array.isArray(initialRelated)) {
          errors.push(path + ": faltan relacionados iniciales en la ficha");
        } else {
          for (const related of initialRelated) {
            if (!html.includes(`href="/${related.slug}"`)) errors.push(path + ": falta enlace SSR a relacionado " + related.slug);
          }
        }
        const initialVariants = (() => {
          try { return JSON.parse(hydration[1])?.props?.pageProps?.initialVariants; }
          catch { return null; }
        })();
        if (!Array.isArray(initialVariants) || !initialVariants.some((v) => v.slug === initialProduct.slug)) {
          errors.push(path + ": faltan variantes iniciales rastreables");
        } else {
          for (const variant of initialVariants.filter((v) => v.colors?.[0])) {
            if (initialVariants.length > 1 && !html.includes(`href="/${variant.slug}"`)) {
              errors.push(path + ": falta enlace HTML a variante " + variant.slug);
            }
          }
        }
        if (!Array.isArray(product.image) || !product.image.length ||
            product.image.some((src) => !/^https:\/\//i.test(src))) {
          errors.push(path + ": imagen JSON-LD no es una URL HTTPS absoluta");
        }
        const stock = initialProduct.stock;
        const expectedAvailability = stock == null ? undefined
          : Number(stock) <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";
        if (product.offers?.availability !== expectedAvailability) {
          errors.push(path + ": disponibilidad no coincide con stock o inventada");
        }
        if (!initialProduct.description?.trim()) warnings.push(path + ": descripción vacía");
        const live = liveBySlug?.get(String(initialProduct.slug).toLowerCase());
        if (live) {
          const priceChanged = !almostEqual(validPrice(live.fullPrice, live.discountPrice), price);
          const stockChanged = live.stock != null && stock != null && Number(live.stock) !== Number(stock);
          if (priceChanged || stockChanged) warnings.push(path + ": API y HTML difieren (" +
            [priceChanged ? "precio" : null, stockChanged ? "stock" : null].filter(Boolean).join(", ") +
            "); revisar ventana ISR");
        }
      }
    }
  }
  console.log(`Auditadas ${total} URLs (${products} fichas detectadas).`);
  if (warnings.length) {
    console.warn("Observaciones GEO (" + warnings.length + ") — primeras 20:");
    warnings.slice(0, 20).forEach((item) => console.warn("- " + item));
    if (warnings.length > 20) console.warn("- … y " + (warnings.length - 20) + " más");
  }
  if (errors.length) {
    console.error(`Se encontraron ${errors.length} incidencias:\n- ${errors.join("\n- ")}`);
    process.exitCode = 1;
  } else console.log("Sin incidencias en los controles automatizados.");
} catch (error) {
  console.error("No se pudo ejecutar la auditoría:", error.message);
  process.exitCode = 1;
}
