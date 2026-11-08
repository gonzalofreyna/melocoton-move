import type { Product } from '../fetchProducts';

export type AccessoryKind = 'block' | 'ball' | 'ring' | 'mat' | 'dumbbells' | 'ankleWeights' | 'bar' | 'triangle' | 'generic';
export type StudioItem = { id: string; slug: string; color: string; x: number; z: number; rotation: number };
export const MAX_ITEMS = 24;
export function accessoryKind(product: Product): AccessoryKind | null {
  const category = product.category.trim().toLowerCase();
  if (category === 'mat') return 'mat';
  if (category !== 'accesorios') return null;
  const slug = product.slug.toLowerCase();
  if (slug.startsWith('bloque-yoga-')) return 'block';
  if (slug.startsWith('mini-ball-pilates-')) return 'ball';
  if (slug.startsWith('magic-ring-pilates-')) return 'ring';
  if (slug.startsWith('mancuerna')) return 'dumbbells';
  if (slug.startsWith('polainas-')) return 'ankleWeights';
  if (slug.startsWith('barra-z-')) return 'bar';
  if (slug.startsWith('pesa-triangular-')) return 'triangle';
  return 'generic';
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

// Catalog dimensions can describe shipping packages; use explicit display references.
export function displaySize(product: Product): [number, number, number] {
  switch (accessoryKind(product)) {
    case 'mat': {
      const d = product.dimensionsCm;
      return d && d.w >= 40 && d.l >= 100 && d.h > 0 && d.h <= 3
        ? [Math.min(d.w / 100, 1), d.h / 100, Math.min(d.l / 100, 2.2)]
        : [.673, .005, 1.813];
    }
    case 'bar': return [1.2, .05, .2];
    case 'dumbbells': return [.3, .06, .22];
    case 'ankleWeights': return [.32, .045, .24];
    case 'triangle': return [.22, .045, .22];
    case 'block': return [.225, .075, .145];
    case 'ball': return [.2, .2, .2];
    case 'ring': return [.38, .05, .32];
    default: return [.2, .1, .2];
  }
}
export function positionLimit(product: Product, rotation = 0) {
  const [w, , l] = displaySize(product);
  const c = Math.abs(Math.cos(rotation)), s = Math.abs(Math.sin(rotation));
  return { x: 1.6 - (w * c + l * s) / 2, z: 1.6 - (w * s + l * c) / 2 };
}
export function clampPosition(product: Product, item: StudioItem): StudioItem {
  const limit = positionLimit(product, item.rotation);
  return { ...item, x: Math.max(-limit.x, Math.min(limit.x, item.x)), z: Math.max(-limit.z, Math.min(limit.z, item.z)) };
}
