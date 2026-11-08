const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('lib/studio/catalog.ts', 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, context);
const { groupAccessories, accessoryKind, canAdd, unitPrice, displaySize, buildVisualItems, STATION_COUNT } = context.exports;
const base = { name: 'Pelota Mini Ball', slug: 'mini-ball-pilates-rosa', category: 'accesorios', colors: ['#FFC5D3'], fullPrice: 319, stock: 1 };
const blue = { ...base, slug: 'mini-ball-pilates-azul', colors: ['#B9E3E5'], fullPrice: 329 };
const block = { ...base, name: 'Bloque', slug: 'bloque-yoga-negro' };
assert.equal(groupAccessories([base, blue, block, { ...base, category: 'reformers' }]).length, 2);
assert.equal(accessoryKind(base), 'ball');
assert.equal(accessoryKind({ ...base, slug: 'otro-accesorio' }), 'generic');
const items = [{ id: 'one', slug: base.slug, x: -1, z: -.75 }];
assert.equal(canAdd(base, items), false);
assert.equal(canAdd(blue, items), true);
assert.equal(canAdd(base, items, 'one'), true);
assert.equal(canAdd({ ...base, stock: 0 }, []), false);
assert.equal(canAdd({ ...base, stock: undefined }, items), true);
assert.equal(unitPrice(blue), 329);
assert.equal(unitPrice({ ...base, discountPrice: 200 }), 200);
assert.equal(unitPrice({ ...base, discountPrice: 400 }), 319);

console.log('Studio catalog: grouping, variant stock, prices and placement passed.');

const mat = { ...base, category: 'mat', slug: 'tapete-yoga', dimensionsCm: { w: 13, h: 13, l: 70 } };
assert.equal(accessoryKind(mat), 'mat');
assert.equal(displaySize(mat)[2], 1.813);
for (const [slug, kind] of [['mancuerna-capsula', 'dumbbells'], ['polainas-1kg', 'ankleWeights'], ['barra-z-pilates', 'bar'], ['pesa-triangular-nude', 'triangle']]) assert.equal(accessoryKind({ ...base, slug }), kind);
assert.equal(groupAccessories([mat, base, { ...base, slug: 'nuevo-accesorio' }]).flat().length, 3);
if (process.env.STUDIO_CATALOG_FIXTURE) {
  const catalog = JSON.parse(fs.readFileSync(process.env.STUDIO_CATALOG_FIXTURE, 'utf8'));
  const eligible = catalog.filter(p => ['accesorios', 'mat'].includes(p.category));
  assert.equal(groupAccessories(catalog).flat().length, eligible.length);
  assert.equal(eligible.filter(p => accessoryKind(p) === 'generic').length, 0);
  console.log(`Live catalog: all ${eligible.length} accessory/mat variants covered with specific models.`);
}

const ring = { ...base, slug: 'magic-ring-pilates-negro', stock: 100 };
const makeItems = (p, count) => Array.from({ length: count }, (_, n) => ({ id: `${p.slug}-${n}`, slug: p.slug, color: p.colors[0], x: 0, z: 0, rotation: 0 }));
const dozen = makeItems(ring, 12);
const visual = buildVisualItems(dozen, [ring]);
assert.equal(visual.length, STATION_COUNT);
assert.equal(new Set(visual.map(i => `${i.x},${i.z}`)).size, 6);
assert.equal(new Set(visual.map(i => i.id)).size, 6);
assert.equal(dozen.length * unitPrice(ring), 12 * 319);
assert.equal(canAdd(ring, makeItems(ring, 25)), true);
assert.equal(buildVisualItems(makeItems(ring, 1), [ring]).length, 6);
assert.equal(buildVisualItems(makeItems(ring, 30), [ring]).length, 6);
assert.equal(buildVisualItems([], [ring]).length, 0);
const mixed = buildVisualItems([...dozen, ...makeItems(mat, 20)], [ring, mat]);
assert.equal(mixed.length, 12); // six rings and six mats, never thirty-two models
assert.equal(mixed.filter(i => i.slug === mat.slug).length, 6);
const manyColors = Array.from({ length: 8 }, (_, n) => ({ ...ring, slug: `magic-ring-pilates-${n}`, colors: [`#00000${n}`] }));
const variants = manyColors.flatMap(p => makeItems(p, 1));
const selectedVisual = buildVisualItems(variants, manyColors, variants[7].id);
assert.equal(selectedVisual.length, 6);
assert.ok(selectedVisual.some(i => i.sourceId === variants[7].id));
assert.ok(selectedVisual.every(i => variants.some(v => v.id === i.sourceId && v.color === i.color)));
console.log('Six-station preview: fixed layout, unlimited visual-independent quantities, mixed types and colors passed.');
