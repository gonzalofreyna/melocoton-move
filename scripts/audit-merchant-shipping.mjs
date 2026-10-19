#!/usr/bin/env node
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
// Read-only audit against the same active product API used by the store/feed.
// No DB writes, checkout calls, or inventory mutations.
const url = process.env.NEXT_PUBLIC_API_PRODUCTS_URL;
if (!url) { console.error("Falta NEXT_PUBLIC_API_PRODUCTS_URL en el entorno."); process.exit(1); }
const response = await fetch(url, { cache: "no-store" });
if (!response.ok) throw new Error(`Error API: HTTP ${response.status}`);
const products = await response.json();
if (!Array.isArray(products)) throw new Error("API no devolvio un arreglo");
const groups = new Map();
const eligible = [];
let excludedStock = 0;
let missing = 0;
let invalid = 0;
let custom = 0;
const examples = [];
for (const p of products) {
  // Match the feed's stock and custom-shipping exclusions.
  if (!Number.isInteger(p.stock) || p.stock < 0) { excludedStock++; continue; }
  if (p.shippingType === "custom") { custom++; continue; }
  eligible.push(p);
  const e = p.shippingEstimate;
  if (!e || e.minBusinessDays == null || e.maxBusinessDays == null) {
    missing++; examples.push({sku:p.sku || p.slug, name:p.name, issue:"sin plazo"}); continue;
  }
  const min = Number(e.minBusinessDays), max = Number(e.maxBusinessDays);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) {
    invalid++; examples.push({sku:p.sku || p.slug,name:p.name,issue:`plazo invalido: ${min}-${max}`}); continue;
  }
  const key = `${min}-${max} dias habiles`;
  groups.set(key,(groups.get(key) || 0) + 1);
}
console.log("Productos activos en API:",products.length);
console.log("Stock sin definir excluido:", excludedStock);
console.log("Envio especial excluido:",custom);
console.log("Elegibles por stock y envio:", eligible.length);
console.log("Productos sin estimacion:",missing);
console.log("Estimaciones invalidas:",invalid);
console.log("Distribucion de plazos totales (min-max):");
for (const [key,n] of [...groups].sort((a,b)=>Number(a[0].split("-")[0])-Number(b[0].split("-")[0]))) console.log(`  ${key}: ${n}`);
if (examples.length) console.log("Ejemplos por revisar:",examples.slice(0,15));

// Optional local feed comparison to explain catalog-count differences without changing data.
try {
  const feed = await fetch("http://localhost:3000/api/google-shopping.xml", { signal: AbortSignal.timeout(8000) });
  if (feed.ok) {
    const xml = await feed.text();
    const ids = [...xml.matchAll(/<g:id>([^<]*)<\/g:id>/g)].map(m => m[1].replace(/&amp;/g,"&"));
    const expected = new Set(eligible.map(p => String(p.sku || p.slug || "").trim()));
    const received = new Set(ids);
    console.log("Feed local, productos:", ids.length);
    console.log("En feed pero no elegibles en API:", [...received].filter(id => !expected.has(id)));
    console.log("Elegibles en API pero no en feed:", [...expected].filter(id => !received.has(id)));
  } else console.log("Feed local HTTP:", feed.status);
} catch { console.log("Feed local no disponible; inicia npm run dev para comparar IDs."); }
