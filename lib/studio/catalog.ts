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
// Only color variants of the exact same model share a family.
// Different weights, finishes and models retain independent display slots.
export function productFamilyKey(product: Product) {
  const normalized = product.name.trim().toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const identity = (product.name + ' ' + product.slug).toLowerCase();
  const weight = identity.match(/(?:^|[^\d])(\d+(?:[.,-]\d+)?)\s*[-_ ]?\s*(kg|kilos?|kilogramos?|lb|lbs)(?![a-z])/i);
  const weightKey = weight ? weight[1].replace(/[,-]/g, '.') + ' ' + (weight[2].startsWith('k') ? 'kg' : 'lb') : '';
  return normalized + '|' + weightKey;
}
export function groupAccessories(products: Product[]) {
  const groups = new Map<string, Product[]>();
  products.filter(p => accessoryKind(p)).forEach(p => {
    const key = productFamilyKey(p);
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
export type DisplayZone = AccessoryKind
  | 'dumbbells-mat' | 'ankleWeights-mat' | 'ankleWeights-heavy'
  | 'block-marble' | 'mat-left-center' | 'mat-right-center'
  | 'mat-left-upper' | 'mat-right-upper' | 'mat-left-lower'
  | 'mat-right-lower' | 'ring-alt' | 'bar-alt';

export function displayZone(product: Product): DisplayZone | null {
  const kind = accessoryKind(product);
  if (!kind) return null;
  const identity = (product.name + ' ' + product.slug).toLowerCase();
  if (kind === 'block' && /marmol|mármol|marble|marmolead/i.test(identity)) return 'block-marble';
  const weight = identity.match(/(?:^|[^\d])(\d+(?:[.,-]\d+)?)\s*[-_ ]?\s*(?:kg|kilo(?:gramos?)?)(?![a-z])/i);
  const kg = weight ? Number(weight[1].replace(/[,-]/g, '.')) : null;
  if (kind === 'dumbbells' && kg === 1) return 'dumbbells-mat';
  if (kind === 'ankleWeights' && kg === 1) return 'ankleWeights-mat';
  if (kind === 'ankleWeights' && kg === 1.5) return 'ankleWeights-heavy';
  return kind;
}

// Five shelf rows, independent floor/mat stations and dedicated wall racks.
// A family uses six positions of its own; no two families occupy the same lane.
const LANE_ORDER: DisplayZone[] = [
  'ball', 'ring', 'bar',
  'ankleWeights', 'ankleWeights-mat', 'ankleWeights-heavy',
  'dumbbells', 'dumbbells-mat', 'block', 'block-marble', 'triangle',
  'generic', 'mat-left-center', 'mat-right-upper', 'mat-left-upper',
  'mat-right-center', 'mat-left-lower', 'mat-right-lower', 'ring-alt', 'bar-alt'
];
const LANE_PREFERENCES: Partial<Record<DisplayZone, DisplayZone[]>> = {
  block: ['block', 'block-marble', 'mat-right-upper'],
  'block-marble': ['block-marble', 'mat-right-upper', 'block'],
  ankleWeights: ['ankleWeights', 'mat-left-lower'],
  'ankleWeights-mat': ['ankleWeights-mat', 'mat-right-lower'],
  'ankleWeights-heavy': ['ankleWeights-heavy', 'mat-left-lower'],
  dumbbells: ['dumbbells', 'mat-left-center'],
  'dumbbells-mat': ['dumbbells-mat', 'mat-left-center'],
  triangle: ['triangle', 'mat-right-upper'],
  generic: ['generic', 'mat-right-center'],
  ring: ['ring', 'ring-alt'],
  bar: ['bar', 'bar-alt'],
  ball: ['ball', 'mat-right-upper'],
};

export function displayPlacement(zone: DisplayZone, index: number) {
  const station = STATIONS[index % STATION_COUNT];
  const shelfX = .65 + index * .39;
  const defaults = { x: shelfX, y: 0, z: -2.45, tiltX: 0, tiltZ: 0 };
  switch (zone) {
    case 'mat': return { ...defaults, ...station };
    case 'dumbbells-mat': return { ...defaults, x: station.x - .17, y: .027, z: station.z - .46 };
    case 'ankleWeights-mat': return { ...defaults, x: station.x + .17, y: .027, z: station.z + .46 };
    case 'ankleWeights-heavy': return { ...defaults, x: station.x - .17, y: .027, z: station.z + .46 };
    case 'mat-left-center': return { ...defaults, x: station.x - .17, y: .027, z: station.z };
    case 'mat-right-center': case 'generic': return { ...defaults, x: station.x + .17, y: .027, z: station.z };
    case 'mat-left-upper': return { ...defaults, x: station.x - .17, y: .027, z: station.z - .72 };
    case 'mat-right-upper': return { ...defaults, x: station.x + .17, y: .027, z: station.z - .72 };
    case 'mat-left-lower': return { ...defaults, x: station.x - .17, y: .027, z: station.z + .72 };
    case 'mat-right-lower': return { ...defaults, x: station.x + .17, y: .027, z: station.z + .72 };
    case 'ball': return { ...defaults, x: -2.80 + (index % 3) * .22, y: .35, z: -.12 + Math.floor(index / 3) * .22 };
    case 'dumbbells': return { ...defaults, y: .82 };
    case 'ankleWeights': return { ...defaults, y: 1.27 };
    case 'block': return { ...defaults, y: 1.72 };
    case 'block-marble': return { ...defaults, y: 2.17 };
    case 'triangle': return { ...defaults, y: 2.62 };
    case 'ring': return { ...defaults, x: -3.02, y: 1.65, z: -1.85 + index * .43, tiltZ: Math.PI / 2 };
    case 'ring-alt': return { ...defaults, x: -3.02, y: 2.2, z: -1.85 + index * .43, tiltZ: Math.PI / 2 };
    case 'bar': return { ...defaults, x: -3.01, y: .65, z: -1.9 + index * .23, tiltZ: Math.PI / 2 };
    case 'bar-alt': return { ...defaults, x: -3.01, y: .65, z: .4 + index * .23, tiltZ: Math.PI / 2 };
  }
}
export type PreviewMode = 'uniform' | 'multi';
export function buildVisualItems(
  items: StudioItem[], products: Product[], selectedId?: string | null, mode: PreviewMode = 'uniform'
): VisualItem[] {
  const catalog = new Map(products.map(p => [p.slug, p]));
  const families = new Map<string, { zone: DisplayZone; variants: Map<string, StudioItem> }>();
  for (const item of items) {
    const product = catalog.get(item.slug);
    const zone = product && displayZone(product);
    if (!product || !zone) continue;
    const familyKey = productFamilyKey(product);
    const group = families.get(familyKey) || { zone, variants: new Map<string, StudioItem>() };
    const key = item.slug + '|' + item.color;
    group.variants.delete(key);
    group.variants.set(key, item);
    families.set(familyKey, group);
  }
  const result: VisualItem[] = [];
  const occupiedLanes = new Set<DisplayZone>();
  // Display six copies for EACH model, not six shared by an entire category.
  const ranked = [...families].sort(([keyA, a], [keyB, b]) =>
    LANE_ORDER.indexOf(a.zone) - LANE_ORDER.indexOf(b.zone) || keyA.localeCompare(keyB));
  for (const [familyKey, family] of ranked) {
    const preference = LANE_PREFERENCES[family.zone] || [family.zone];
    const lane = [...preference, ...LANE_ORDER].find(candidate => candidate !== 'mat' && !occupiedLanes.has(candidate));
    // Capacity is finite: never render one family on top of another.
    if (!lane) continue;
    occupiedLanes.add(lane);
    const values = [...family.variants.values()];
    const shown = mode === 'multi' ? values.slice(-STATION_COUNT) : values.slice(-1);
    for (let index = 0; index < STATION_COUNT; index++) {
      const item = shown[index % shown.length];
      result.push({
        ...item, id: encodeURIComponent(familyKey) + '-station-' + index, sourceId: item.id,
        ...displayPlacement(lane, index), rotation: 0
      });
    }
  }
  return result;
}
