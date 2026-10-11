/** Destinos SEO especiales; las demás categorías mantienen su filtro actual. */
export function categoryHref(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (normalized === "mat") return "/tapetes-yoga-pilates";
  if (normalized === "calcetas") return "/calcetines-antideslizantes-pilates";
  return `/products?category=${encodeURIComponent(category)}`;
}
