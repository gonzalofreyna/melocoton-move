import type { Product } from '../fetchProducts';

export type AccessoryKind = 'block' | 'ball' | 'ring' | 'mat' | 'dumbbells' | 'ankleWeights' | 'bar' | 'triangle' | 'generic';
export type StudioItem = { id: string; slug: string; color: string; x: number; z: number; rotation: number };
export const STATION_COUNT = 6;
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
// Six fixed display stations, independent of quantities in the selection.
export const STATIONS = Array.from({ length: STATION_COUNT }, (_, index) => ({
  x: (index % 3 - 1) * 1.8, z: index < 3 ? -1.25 : 1.25,
}));
export type VisualItem = StudioItem & { sourceId: string; y: number; tiltX: number; tiltZ: number };
// Storage positions are shared by every variant of the same accessory family.
export function displayPlacement(kind: AccessoryKind, index: number) {
  const station = STATIONS[index];
  const shelfX = .65 + index * .39;
  const defaults = { x: shelfX, y: 0, z: -2.45, tiltX: 0, tiltZ: 0 };
  switch (kind) {
    case 'mat': return { ...defaults, ...station };
    case 'ball': return { ...defaults, x: 1.35 + (index % 3) * .22, y: .25, z: -2.48 + Math.floor(index / 3) * .22 };
    case 'block': return { ...defaults, y: 1.72 };
    case 'dumbbells': return { ...defaults, y: .82 };
    case 'ankleWeights': return { ...defaults, y: 1.27 };
    case 'triangle': return { ...defaults, y: 2.17 };
    case 'generic': return { ...defaults, y: 2.62 };
    case 'ring': return { ...defaults, x: -3.02, y: 1.65, z: -1.85 + index * .43, tiltZ: Math.PI / 2 };
    case 'bar': return { ...defaults, x: -3.01, y: .65, z: -1.9 + index * .23, tiltZ: Math.PI / 2 };
  }
}
export function buildVisualItems(items: StudioItem[], products: Product[], selectedId?: string | null): VisualItem[] {
  const catalog = new Map(products.map(p => [p.slug, p]));
  const kinds = new Map<AccessoryKind, Map<string, StudioItem>>();
  for (const item of items) {
    const product = catalog.get(item.slug), kind = product && accessoryKind(product);
    if (!kind) continue;
    const variants = kinds.get(kind) || new Map<string, StudioItem>();
    const key = `${item.slug}|${item.color}`;
    if (!variants.has(key) || item.id === selectedId) variants.set(key, item);
    kinds.set(kind, variants);
  }
  const result: VisualItem[] = [];
  for (const [kind, variants] of kinds) {
    const all = [...variants.values()];
    const examples = all.slice(0, STATION_COUNT);
    const selected = all.find(i => i.id === selectedId);
    if (selected && !examples.includes(selected)) examples[STATION_COUNT - 1] = selected;
    STATIONS.forEach((station, index) => {
      const item = examples[index % examples.length];
      result.push({ ...item, id: `${kind}-station-${index}`, sourceId: item.id,
        ...displayPlacement(kind, index), rotation: 0 });
    });
  }
  return result;
}
