// Verifica el HTML de la fase GEO sin depender de un navegador.
// Ejecutar después de npm run build && npm run start:
// node scripts/audit-geo.mjs
const base = process.env.GEO_AUDIT_URL || "http://localhost:3000";
const checks = [
  { path: "/", required: ["Melocotón Move"], schema: "Organization" },
  { path: "/aboutus", required: ["¿Qué es Melocotón Move?", "tapetes de yoga y Pilates", "calcetas antideslizantes"] },
  { path: "/tapetes-yoga-pilates", required: ["Preguntas frecuentes", "¿Qué grosor tienen los tapetes?", "/guia-elegir-tapete-yoga-pilates"] },
  { path: "/calcetines-antideslizantes-pilates", required: ["Preguntas frecuentes", "¿Se pueden usar para Pilates reformer y barre?", "/guia-calcetas-antideslizantes-pilates"] },
  { path: "/guia-elegir-tapete-yoga-pilates", required: ["Cómo elegir un tapete de yoga y Pilates", "Revisa los materiales", "/tapetes-yoga-pilates"] },
  { path: "/guia-calcetas-antideslizantes-pilates", required: ["Cómo elegir calcetas antideslizantes para Pilates", "Comprueba el agarre", "/calcetines-antideslizantes-pilates"] },
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
    for (const value of required) {
      if (!html.includes(value)) errors.push(path + ": falta contenido " + value);
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
  console.log("Auditoría GEO local superada: 6 páginas, robots.txt y sitemap.");
}
