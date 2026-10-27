// Shared pricing rules for quote preview and Stripe checkout.
export class PricingValidationError extends Error {
  constructor(message) { super(message); this.name = "PricingValidationError"; }
}
const invalid = (message) => { throw new PricingValidationError(message); };
const integer = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
};
export const wholesaleConfig = () => ({
  enabled: process.env.WHOLESALE_ENABLED === "true",
  minQty: Math.max(1, integer(process.env.WHOLESALE_MIN_QTY, 5)),
  percent: Math.min(100, Math.max(0, integer(process.env.WHOLESALE_DISCOUNT_PERCENT, 15))),
});
const categoryKey = (value) => String(value || "general").trim().toLocaleLowerCase("es-MX");
const excluded = (product) =>
  /crea[- ]tu[- ]mat|personalizad/i.test(String(product.slug || "")) ||
  /crea[- ]tu[- ]mat|personalizad/i.test(String(product.category || ""));
const money = (value) => Math.round(Number(value) * 100);
export function priceCart(items, catalog, config = wholesaleConfig()) {
  if (!Array.isArray(items) || !items.length) invalid("Carrito vacío");
  const bySlug = new Map(catalog.map((product) => [String(product.slug), product]));
  const lines = new Map();
  for (const item of items) {
    const slug = String(item.slug || "");
    const product = bySlug.get(slug);
    if (!product) invalid(`Producto inválido o no encontrado: ${slug}`);
    const qty = Number(item.quantity);
    if (!Number.isSafeInteger(qty) || qty < 1) invalid(`Cantidad inválida: ${slug}`);
    const current = lines.get(slug);
    const combined = (current?.quantity || 0) + qty;
    if (!Number.isSafeInteger(combined)) invalid(`Cantidad inválida: ${slug}`);
    lines.set(slug, { product, quantity: combined });
  }
  const counts = new Map();
  for (const { product, quantity } of lines.values()) {
    if (!excluded(product)) {
      const key = categoryKey(product.category);
      counts.set(key, (counts.get(key) || 0) + quantity);
    }
  }
  let subtotalCents = 0;
  let discountCents = 0;
  const pricedItems = [];
  for (const { product, quantity } of lines.values()) {
    const limit = Math.min(
      product.maxQty != null && Number.isSafeInteger(Number(product.maxQty)) && Number(product.maxQty) > 0 ? Number(product.maxQty) : 10,
      product.stock != null && Number.isSafeInteger(Number(product.stock)) && Number(product.stock) >= 0 ? Number(product.stock) : Infinity,
    );
    if (limit === 0) invalid(`Producto agotado: ${product.name}`);
    if (quantity > limit) invalid(`Solo puedes comprar hasta ${limit} unidad(es) de ${product.name}`);
    const regular = Number(product.fullPrice);
    const sale = product.discountPrice == null ? NaN : Number(product.discountPrice);
    const base = Number.isFinite(sale) && sale > 0 && sale < regular ? sale : regular;
    if (!Number.isFinite(base) || base <= 0) invalid(`Precio inválido: ${product.name}`);
    const unitBaseCents = money(base);
    if (!Number.isSafeInteger(unitBaseCents) || unitBaseCents < 1) invalid(`Precio inválido: ${product.name}`);
    const eligible = config.enabled && !excluded(product) &&
      (counts.get(categoryKey(product.category)) || 0) >= config.minQty;
    const unitCents = eligible ? Math.round(unitBaseCents * (100 - config.percent) / 100) : unitBaseCents;
    subtotalCents += unitBaseCents * quantity;
    discountCents += (unitBaseCents - unitCents) * quantity;
    pricedItems.push({
      slug: String(product.slug), quantity, product,
      unitBaseCents, unitCents, wholesale: eligible,
    });
  }
  return {
    items: pricedItems,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    config,
  };
}
