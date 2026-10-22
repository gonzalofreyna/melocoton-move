#!/usr/bin/env node
// Read-only smoke test. Usage: node scripts/validate-google-merchant-feed.mjs http://localhost:3000/api/google-shopping.xml
// No writes to Merchant Center or to the store.
const url = process.argv[2] || "http://localhost:3000/api/google-shopping.xml";
const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
const xml = await response.text();
if (!xml.includes('<rss version="2.0"') || !xml.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
  throw new Error("No es RSS 2.0 con espacio de nombres de Google");
}
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
if (items.length === 0) throw new Error("Feed vacío: revisar catálogo antes de publicarlo");
const get = (s, name) => s.match(new RegExp(`<g:${name}>([\\s\\S]*?)<\\/g:${name}>`))?.[1];
const errors = [];
const ids = new Set();
for (const item of items) {
  const id = get(item, "id");
  // The nested <g:shipping><g:price> is a shipping charge, not the product price.
  const productFields = item.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/g, "");
  const price = get(productFields, "price");
  const image = get(item, "image_link");
  const link = get(item, "link");
  const label = get(item, "shipping_label");
  const availability = get(item, "availability");
  if (!id || ids.has(id)) errors.push(`ID vacío o duplicado: ${id}`);
  ids.add(id);
  if (!get(item,"title") || !get(item,"description")) errors.push(`${id}: sin título o descripción`);
  if (!/^\d+\.\d{2} MXN$/.test(price || "")) errors.push(`${id}: precio inválido: ${price}`);
  for (const [field, value] of [["image_link", image], ["link", link]]) {
    if (!value || !value.startsWith("https://")) errors.push(`${id}: ${field} inválido`);
  }
  if (!["in_stock", "out_of_stock"].includes(availability)) errors.push(`${id}: stock inválido`);
  if (!/^(estandar|promo-elegible)-entrega-\d+-\d+-habiles$/.test(label || "")) errors.push(`${id}: shipping_label inválido`);
  if (/<g:shipping>/.test(item)) errors.push(`${id}: tarifa fija de envío declarada sin validación`);
  if (get(item, "sale_price") && Number.parseFloat(get(item,"sale_price")) >= Number.parseFloat(price)) errors.push(`${id}: oferta no menor que precio`);
}
console.log(`Merchant feed: ${items.length} artículos; ${errors.length} errores`);
if (errors.length) {
  console.error(errors.slice(0, 50).join("\n"));
  process.exitCode = 1;
} else console.log("Validación XML básica correcta. Falta comparar tarifas reales y configurar Merchant Center.");
