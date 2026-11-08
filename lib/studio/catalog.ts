import type { Product } from '../fetchProducts';

export type AccessoryKind = 'block' | 'ball' | 'ring';
export type StudioItem = { id: string; slug: string; color: string; x: number; z: number; rotation: number };
export const MAX_ITEMS = 24;
export function accessoryKind(product: Product): AccessoryKind | null {
  if (product.category.toLowerCase() !== 'accesorios') return null;
  const slug = product.slug.toLowerCase();
  if (slug.startsWith('bloque-yoga-')) return 'block';
  if (slug.startsWith('mini-ball-pilates-')) return 'ball';
  if (slug.startsWith('magic-ring-pilates-')) return 'ring';
  return null;
}
export function groupAccessories(products: Product[]) {
  const groups = new Map<string, Product[]>();
  products.filter(p => accessoryKind(p)).forEach(p => {
    const key = p.name.trim().toLowerCase().replace(/\s+/g, ' ');
    groups.set(key, [...(groups.get(key) || []), p]);
  });
  return [...groups.values()];
}
export function unitPrice(p: Product) {
  return p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.fullPrice ? p.discountPrice : p.fullPrice;
}
export function canAdd(p: Product, items: StudioItem[], excludingId?: string) {
  return p.stock == null || items.filter(i => i.slug === p.slug && i.id !== excludingId).length < p.stock;
}
const names: Record<string, string> = {
  '#000000': 'Negro', '#303030': 'Negro', '#e7ded3': 'Nude', '#ffc5d3': 'Rosa',
  '#b9e3e5': 'Azul', '#d97053': 'Naranja', '#b4a997': 'Arena', '#eed09d': 'Madera',
  '#d3d3ff': 'Lila', '#ffb5c0': 'Rosa',
};
export function colorName(color: string) { return names[color.toLowerCase()] || color || 'Color único'; }
export function nextPosition(items: StudioItem[]) {
  for (let n = 0; n < MAX_ITEMS; n++) {
    const x = (n % 6 - 2.5) * .4, z = (Math.floor(n / 6) - 1.5) * .5;
    if (!items.some(i => Math.abs(i.x - x) < .18 && Math.abs(i.z - z) < .18)) return { x, z };
  }
  return { x: 0, z: 0 };
}
