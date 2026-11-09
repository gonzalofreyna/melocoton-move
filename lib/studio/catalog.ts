import type { Product } from '../fetchProducts';

export type AccessoryKind = 'block' | 'ball' | 'ring' | 'mat' | 'dumbbells' | 'ankleWeights' | 'bar' | 'triangle' | 'generic';
export type StudioItem = { id: string; slug: string; color: string; x: number; z: number; rotation: number };
export const STATION_COUNT = 3;
// Cotización del estudio: el 15% aplica por renglón con 5+ piezas
// del mismo producto. No se agrupan categorías ni modelos distintos.
export function studioQuotePrice(unitPrice: number, quantity: number) {
  const qty = Math.max(0, Math.floor(quantity));
  const regularUnit = Math.round(unitPrice * 100) / 100;
  const discounted = qty >= 5;
  const finalUnit = discounted ? Math.round(regularUnit * 0.85 * 100) / 100 : regularUnit;
  const subtotal = Math.round(regularUnit * qty * 100) / 100;
  const total = Math.round(finalUnit * qty * 100) / 100;
  return { discounted, regularUnit, finalUnit, subtotal, total, savings: Math.round((subtotal - total) * 100) / 100 };
}

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
  const finish = accessoryKind(product) === 'block'
    ? (/marmol|mármol|marble|marmolead/i.test(identity) ? 'marble' : 'solid') : '';
  const size = identity.match(/(?:^|[^\d])(\d+(?:[.,-]\d+)?)\s*[-_ ]?\s*cm(?![a-z])/i);
  const sizeKey = size ? size[1].replace(/[,-]/g, '.') + 'cm' : '';
  return accessoryKind(product) + '|' + normalized + '|' + weightKey + '|' + finish + '|' + sizeKey;
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
// Three mats, each centered in front of its own bay on the mirrored back wall.
export const STATIONS = Array.from({ length: STATION_COUNT }, (_, index) => ({
  // Rear edge of a 1.82m mat stays ~13cm ahead of the mirror wall.
  x: (index - 1) * 2.05, z: -1.70,
}));
export type VisualItem = StudioItem & { sourceId: string; y: number; tiltX: number; tiltZ: number };
// Each model receives three distinct display positions; colors share only that model's lane.
export type DisplayZone = AccessoryKind
  | 'dumbbells-mat' | 'ankleWeights-mat' | 'ankleWeights-heavy'
  | 'block-marble' | 'mat-left-center' | 'mat-right-center'
  | 'mat-left-upper' | 'mat-right-upper' | 'mat-left-lower'
  | 'mat-right-lower' | 'ring-alt' | 'ring-high' | 'ring-side' | 'bar-alt';

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
  'mat-left-center', 'mat-right-upper', 'mat-left-upper',
  'mat-right-center', 'mat-left-lower', 'mat-right-lower', 'generic', 'ring-alt', 'ring-high', 'ring-side', 'bar-alt'
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
  generic: ['generic', 'mat-left-center'],
  ring: ['ring', 'ring-alt', 'ring-high', 'ring-side'],
  bar: ['bar', 'bar-alt'],
  ball: ['ball', 'mat-right-upper'],
};

export function displayPlacement(zone: DisplayZone, index: number) {
  const station = STATIONS[index % STATION_COUNT];
  // Three products along each shelf on the left wall, with safe spacing.
  const shelfZ = .54 + index * .78;
  const defaults = { x: -2.80, y: .05, z: shelfZ, tiltX: 0, tiltZ: 0 };
  switch (zone) {
    case 'mat': return { ...defaults, ...station, y: 0 };
    // Distinct positions on every mat, all in front of the matching mirror.
    case 'dumbbells-mat': return { ...defaults, x: station.x - .17, y: .027, z: station.z - .47 };
    case 'ankleWeights-mat': return { ...defaults, x: station.x + .17, y: .027, z: station.z + .48 };
    case 'ankleWeights-heavy': return { ...defaults, x: station.x - .17, y: .027, z: station.z + .48 };
    case 'mat-left-center': return { ...defaults, x: station.x - .17, y: .027, z: station.z };
    case 'mat-right-center': return { ...defaults, x: station.x + .17, y: .027, z: station.z };
    case 'generic': return { ...defaults, x: station.x + .20, y: .027, z: station.z + .71 };
    case 'mat-left-upper': return { ...defaults, x: station.x - .17, y: .027, z: station.z - .72 };
    case 'mat-right-upper': return { ...defaults, x: station.x + .17, y: .027, z: station.z - .72 };
    case 'mat-left-lower': return { ...defaults, x: station.x - .17, y: .027, z: station.z + .72 };
    case 'mat-right-lower': return { ...defaults, x: station.x + .17, y: .027, z: station.z + .72 };
    // Three balls are placed inside the basket immediately below the shelves.
    case 'ball': return { ...defaults, x: -2.79, y: .31, z: .73 + index * .52 };
    case 'dumbbells': return { ...defaults, y: .83 };
    case 'ankleWeights': return { ...defaults, y: 1.26 };
    case 'block': return { ...defaults, y: 1.69 };
    case 'block-marble': return { ...defaults, y: 2.12 };
    case 'triangle': return { ...defaults, y: 2.55 };
    case 'ring': return { ...defaults, x: -3.02, y: 2.72, z: -2.18 + index * .49, tiltZ: Math.PI / 2 };
    case 'ring-alt': return { ...defaults, x: -3.02, y: 2.49, z: -2.18 + index * .49, tiltZ: Math.PI / 2 };
    case 'ring-high': return { ...defaults, x: -3.02, y: 2.26, z: -2.18 + index * .49, tiltZ: Math.PI / 2 };
    case 'ring-side': return { ...defaults, x: -3.02, y: 2.03, z: -2.18 + index * .49, tiltZ: Math.PI / 2 };
    case 'bar': return { ...defaults, x: -3.02, y: .39, z: -2.20 + index * .55, tiltZ: Math.PI / 2 };
    case 'bar-alt': return { ...defaults, x: -3.02, y: .57, z: -2.20 + index * .55, tiltZ: Math.PI / 2 };
  }
}
// Additional galleries expand to the right of the original three-mat room.
// A gallery holds three display models with full clearance
// for long bars. They are visual stations, not order quantities.
export const OVERFLOW_GALLERY_START_X = 4.35;
export const OVERFLOW_GALLERY_WIDTH = 5.1;
export function overflowPlacement(gallery: number, index: number) {
  return {
    x: OVERFLOW_GALLERY_START_X + gallery * OVERFLOW_GALLERY_WIDTH + index * 1.45,
    y: .48,
    z: .35,
    tiltX: 0,
    tiltZ: 0,
  };
}

export function buildVisualItems(
  items: StudioItem[], products: Product[], selectedId?: string | null
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
  let overflowFamilies = 0;
  // Display three copies for EACH model, not three shared by an entire category.
  const ranked = [...families].sort(([keyA, a], [keyB, b]) =>
    LANE_ORDER.indexOf(a.zone) - LANE_ORDER.indexOf(b.zone) || keyA.localeCompare(keyB));
  for (const [familyKey, family] of ranked) {
    const preference = LANE_PREFERENCES[family.zone] || [family.zone];
    const fallback = family.zone === 'ring' ? ['ring', 'ring-alt', 'ring-high', 'ring-side'] :
      family.zone === 'bar' ? ['bar', 'bar-alt'] :
      family.zone === 'ball' ? ['ball', 'mat-right-upper', 'mat-left-upper'] :
      LANE_ORDER.filter(candidate => candidate !== 'ball' && candidate !== 'ring' &&
        candidate !== 'bar' && candidate !== 'ring-alt' && candidate !== 'ring-high' && candidate !== 'ring-side' && candidate !== 'bar-alt');
    const lane = [...preference, ...fallback].find(candidate => candidate !== 'mat' && !occupiedLanes.has(candidate));
    // Once the original studio fills up, allocate a complete new three-piece
    // gallery module. Never silently discard a selected model.
    const overflowIndex = lane ? -1 : overflowFamilies++;
    if (lane) occupiedLanes.add(lane);
    const values = [...family.variants.values()];
    const item = values[values.length - 1];
    for (let index = 0; index < STATION_COUNT; index++) {
      result.push({
        ...item, id: encodeURIComponent(familyKey) + '-station-' + index, sourceId: item.id,
        ...(lane ? displayPlacement(lane, index) : overflowPlacement(overflowIndex, index)), rotation: 0
      });
    }
  }
  return result;
}
