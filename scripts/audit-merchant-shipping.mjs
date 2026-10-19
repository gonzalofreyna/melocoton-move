import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
#!/usr/bin/env node
// Read-only audit against the same active product API used by the store/feed.
// No DB writes, checkout calls, or inventory mutations.
const url = process.env.NEXT_PUBLIC_API_PRODUCTS_URL;
if (!url) { console.error("Falta NEXT_PUBLIC_API_PRODUCTS_URL en el entorno."); process.exit(1); }
const response = await fetch(url, { cache: "no-store" });
if (!response.ok) throw new Error(`Error API: HTTP ${response.status}`);
const products = await response.json();
if (!Array.isArray(products)) throw new Error("API no devolvio un arreglo");
const groups = new Map();
let missing = 0;
let invalid = 0;
let custom = 0;
const examples = [];
for (const p of products) {
  // Match the feed's stock and custom-shipping exclusions.
  if (!Number.isInteger(p.stock) || p.stock < 0) continue;
  if (p.shippingType === "custom") { custom++; continue; }
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
console.log("Envio especial excluido:",custom);
console.log("Productos sin estimacion:",missing);
console.log("Estimaciones invalidas:",invalid);
console.log("Distribucion de plazos totales (min-max):");
for (const [key,n] of [...groups].sort((a,b)=>Number(a[0].split("-")[0])-Number(b[0].split("-")[0]))) console.log(`  ${key}: ${n}`);
if (examples.length) console.log("Ejemplos por revisar:",examples.slice(0,15));
