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
// Six fixed visual places per display zone: selected variants share slots, never overlap.
export type DisplayZone = AccessoryKind | 'dumbbells-mat' | 'ankleWeights-mat';
export function displayZone(product: Product): DisplayZone | null {
  const kind = accessoryKind(product);
  if (!kind) return null;
  const identity = `${product.name} ${product.slug}`.toLowerCase();
  // Match exactly 1 kg / 1.0 kg; 0.5 kg and 2.5 kg remain on their shelves.
  const oneKg = /(?:^|[^\d.,])1(?:[.,]0)?\s*[-_ ]?\s*(?:kg|kilo(?:gramos?)?)(?![\d])/i.test(identity);
  if (kind === 'dumbbells' && oneKg) return 'dumbbells-mat';
  if (kind === 'ankleWeights' && oneKg) return 'ankleWeights-mat';
  return kind;
}
export function displayPlacement(zone: DisplayZone, index: number) {
  const station = STATIONS[index];
  const shelfX = .65 + index * .39;
  const defaults = { x: shelfX, y: 0, z: -2.45, tiltX: 0, tiltZ: 0 };
  switch (zone) {
    case 'mat': return { ...defaults, ...station };
    // Mat products sit at distinct offsets, not at the same spot on a mat.
    case 'dumbbells-mat': return { ...defaults, x: station.x - .18, y: .027, z: station.z - .32 };
    case 'ankleWeights-mat': return { ...defaults, x: station.x + .18, y: .027, z: station.z + .32 };
    case 'ball': return { ...defaults, x: -2.80 + (index % 3) * .22, y: .35, z: -.12 + Math.floor(index / 3) * .22 };
    case 'block': return { ...defaults, y: 1.72 };
    case 'dumbbells': return { ...defaults, y: .82 };
    case 'ankleWeights': return { ...defaults, y: 1.27 };
    case 'triangle': return { ...defaults, y: 2.17 };
    case 'generic': return { ...defaults, y: 2.62 };
    case 'ring': return { ...defaults, x: -3.02, y: 1.65, z: -1.85 + index * .43, tiltZ: Math.PI / 2 };
    case 'bar': return { ...defaults, x: -3.01, y: .65, z: -1.9 + index * .23, tiltZ: Math.PI / 2 };
  }
}
function variantFamily(product: Product, zone: DisplayZone) {
  if (zone === 'block') return /marmol|marble/i.test(`${product.slug} ${product.name}`) ? 'block-marble' : 'block-solid';
  return product.name.trim().toLowerCase().replace(/\s+/g, ' ');
}
export type PreviewMode = 'uniform' | 'multi';
export function buildVisualItems(
  items: StudioItem[], products: Product[], selectedId?: string | null, mode: PreviewMode = 'uniform'
): VisualItem[] {
  const catalog = new Map(products.map(p => [p.slug, p]));
  const zones = new Map<DisplayZone, Map<string, Map<string, StudioItem>>>();
  for (const item of items) {
    const product = catalog.get(item.slug);
    const zone = product && displayZone(product);
    if (!product || !zone) continue;
    const families = zones.get(zone) || new Map<string, Map<string, StudioItem>>();
    const family = variantFamily(product, zone);
    const variants = families.get(family) || new Map<string, StudioItem>();
    const key = `${item.slug}|${item.color}`;
    // Reinsert so the last added color is considered the currently showcased one,
    // even when the same color was already in the order.
    variants.delete(key);
    variants.set(key, item);
    families.set(family, variants);
    zones.set(zone, families);
  }
  const result: VisualItem[] = [];
  for (const [zone, families] of zones) {
    const groups = [...families.values()].map(variants => {
      const unique = [...variants.values()];
      // The order retains all selected colors. Only the preview is limited.
      return mode === 'multi' ? unique.slice(-STATION_COUNT) : unique.slice(-1);
    });
    // Share the six fixed positions across families to prevent two types of
    // blocks or other accessories from rendering in the same physical spot.
    for (let index = 0; index < STATION_COUNT; index++) {
      const group = groups[index % groups.length];
      const item = group[Math.floor(index / groups.length) % group.length];
      result.push({ ...item, id: `${zone}-station-${index}`, sourceId: item.id,
        ...displayPlacement(zone, index), rotation: 0 });
    }
  }
  return result;
}
