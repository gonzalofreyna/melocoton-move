// Verifica el HTML de la fase GEO sin depender de un navegador.
// Ejecutar después de npm run build && npm run start:
// node scripts/audit-geo.mjs
const base = process.env.GEO_AUDIT_URL || "http://localhost:3000";
const checks = [
  { path: "/", required: ["Descubre Melocotón Move: yoga", "Ver tapetes de yoga y Pilates", "Ver calcetas antideslizantes", "Personalizar mi mat", "/melocoton-en-movimiento", "Descubre nuestras historias"], schema: "Organization" },
  { path: "/aboutus", required: ["¿Qué es Melocotón Move?", "tapetes de yoga y Pilates", "calcetas antideslizantes"] },
  { path: "/tapetes-yoga-pilates", required: ["Preguntas frecuentes", "¿Qué grosor tienen los tapetes?", "/guia-elegir-tapete-yoga-pilates", "/crea-tu-mat", "Diseñar mi mat personalizado", "/melocoton-en-movimiento"] },
  { path: "/calcetines-antideslizantes-pilates", required: ["Preguntas frecuentes", "¿Se pueden usar para Pilates reformer y barre?", "¿Dónde comprar calcetas antideslizantes para Pilates en México?", "modelos Basic y Curly", "/guia-calcetas-antideslizantes-pilates"] },
  { path: "/guia-elegir-tapete-yoga-pilates", required: ["Cómo elegir un tapete de yoga y Pilates", "Revisa los materiales", "/tapetes-yoga-pilates", "Diseñar mi tapete personalizado", "/crea-tu-mat"] },
  { path: "/guia-calcetas-antideslizantes-pilates", required: ["Cómo elegir calcetas antideslizantes para Pilates", "Comprueba el agarre", "Dónde comprar calcetas para Pilates en México", "/calcetines-antideslizantes-pilates"] },
  { path: "/crea-tu-mat", required: ["Desde una sola pieza", "Personalización láser", "Tapetes de yoga y Pilates personalizados con tu logo en México", "/tapetes-yoga-pilates"] },
  { path: "/melocoton-en-movimiento", required: ["Melocotón en movimiento", "Historias que nos inspiran", "Del movimiento a tu práctica", "/tapetes-yoga-pilates", "/calcetines-antideslizantes-pilates", "4125f23c3a9141589692e1587489afbe.mp4"] },
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
    if (path === "/melocoton-en-movimiento") {
      const videos = [...visibleHtml.matchAll(/<source\b[^>]*\bsrc="(https:\/\/melocoton-move-assets\.s3\.us-east-1\.amazonaws\.com\/videos\/customers\/[^"]+\.mp4)"/gi)]
        .map((m) => m[1]);
      if (videos.length !== 9 || new Set(videos).size !== 9) {
        errors.push("/melocoton-en-movimiento: deben aparecer 9 videos S3 únicos en el HTML inicial");
      }
      const playerTags = [...visibleHtml.matchAll(/<video\b[^>]*>/gi)].map((m) => m[0]);
      const heroPlayer = playerTags[0] ?? "";
      const hasVideoFlag = (tag, flag) => new RegExp("(?:\\s)" + flag + "(?=\\s|=|>)", "i").test(tag);
      if (playerTags.length !== 9 || !["autoplay", "muted", "playsinline", "loop"].every((flag) => hasVideoFlag(heroPlayer, flag))) {
        errors.push("/melocoton-en-movimiento: el video principal debe tener autoplay, muted, playsInline y loop");
      }
      if (playerTags.slice(1).some((tag) => hasVideoFlag(tag, "autoplay") || !/preload=["']none["']/i.test(tag))) {
        errors.push("/melocoton-en-movimiento: los ocho videos secundarios no deben usar autoplay y deben usar preload=none");
      }
      const posters = [...visibleHtml.matchAll(/\bposter="(https:\/\/melocoton-move-assets\.s3\.us-east-1\.amazonaws\.com\/videos\/customers\/portada\/[^"]+-poster\.webp)"/gi)]
        .map((m) => m[1]);
      const expectedPosters = videos.map((video) => video.replace("/videos/customers/", "/videos/customers/portada/").replace(/\.mp4$/i, "-poster.webp"));
      if (posters.length !== 9 || new Set(posters).size !== 9 || expectedPosters.some((poster) => !posters.includes(poster))) {
        errors.push("/melocoton-en-movimiento: faltan portadas WebP en /videos/customers/portada/ o no corresponden a los MP4");
      }
      const seoTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
      if (!seoTitle.includes("Videos de Pilates y yoga") || seoTitle.length > 60) {
        errors.push("/melocoton-en-movimiento: título SEO ausente o demasiado extenso");
      }
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? "";
      if (ogImage !== posters[0]) errors.push("/melocoton-en-movimiento: og:image debe usar la portada del video principal");
      if (!html.includes('name="twitter:card"')) errors.push("/melocoton-en-movimiento: falta twitter:card");
      const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
        .flatMap((match) => { try { return [JSON.parse(match[1])]; } catch { errors.push("/melocoton-en-movimiento: JSON-LD inválido"); return []; } });
      const breadcrumb = jsonLd.find((item) => item["@type"] === "BreadcrumbList");
      if (breadcrumb?.itemListElement?.length !== 2 ||
          breadcrumb.itemListElement?.[1]?.item !== "https://www.melocotonmove.com/melocoton-en-movimiento") {
        errors.push("/melocoton-en-movimiento: falta BreadcrumbList válido");
      }
      for (const item of jsonLd.filter((item) => item["@type"] === "VideoObject")) {
        if (!item.name?.trim() || !item.description?.trim() || !/^\d{4}-\d{2}-\d{2}/.test(item.uploadDate || "") ||
            !videos.includes(item.contentUrl) || !posters.includes(item.thumbnailUrl)) {
          errors.push("/melocoton-en-movimiento: VideoObject sin metadatos verificables o video válido");
        }
      }
    }
    if (path === "/crea-tu-mat" && !/<h1\b[^>]*>\s*Tapetes de yoga y Pilates personalizados con tu logo en México\s*<\/h1>/i.test(visibleHtml)) {
      errors.push("/crea-tu-mat: falta H1 visible en el HTML inicial");
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
      // El HTML inicial debe contener exactamente un H1, dentro del Hero
      // y antes de la sección editorial; el carrusel llega después por JS.
      const h1Matches = [...visibleHtml.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
      if (h1Matches.length !== 1) {
        errors.push("/: se espera exactamente un H1 en el HTML inicial; encontrados " + h1Matches.length);
      }
      const heroSection = visibleHtml.match(/<section\b[^>]*aria-label=["']Hero de Melocotón Move["'][^>]*>([\s\S]*?)<\/section>/i);
      if (!heroSection || !/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(heroSection[1])) {
        errors.push("/: falta H1 dentro del Hero en el HTML inicial");
      }
      if (heroSection && visibleHtml.indexOf(heroSection[0]) > visibleHtml.indexOf('id="home-melocoton-movimiento"')) {
        errors.push("/: el H1 del Hero debe estar antes del enlace editorial");
      }
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
  if (!sitemap.includes("https://www.melocotonmove.com/melocoton-en-movimiento</loc>")) errors.push("sitemap: falta /melocoton-en-movimiento");
  // El sitemap de video debe exponer los nueve MP4 y sus portadas, sin datos inventados.
  if (!sitemap.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"')) {
    errors.push("sitemap: falta namespace video");
  }
  const videoEntries = [...sitemap.matchAll(/<video:video>([\s\S]*?)<\/video:video>/g)].map((m) => m[1]);
  if (videoEntries.length !== 9) errors.push("sitemap: deben existir nueve video:video");
  const videoSources = videoEntries.map((item) => item.match(/<video:content_loc>([^<]+)<\/video:content_loc>/)?.[1]);
  const videoPosters = videoEntries.map((item) => item.match(/<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/)?.[1]);
  if (new Set(videoSources).size !== 9 || videoSources.some((item) => !item?.endsWith(".mp4"))) {
    errors.push("sitemap: video:content_loc duplicados o inválidos");
  }
  if (new Set(videoPosters).size !== 9 || videoPosters.some((item) => !item?.endsWith("-poster.webp"))) {
    errors.push("sitemap: miniaturas WebP duplicadas o inválidas");
  }
  if (videoEntries.some((item) => !item.includes("<video:title>") || !item.includes("<video:description>"))) {
    errors.push("sitemap: título o descripción de video ausentes");
  }
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
