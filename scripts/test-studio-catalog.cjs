const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('lib/studio/catalog.ts', 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, context);
const { groupAccessories, accessoryKind, canAdd, unitPrice, displaySize, buildVisualItems, displayPlacement, displayZone, STATION_COUNT } = context.exports;
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
// Uniform mode showcases the most recently added color while keeping every
// order line. Multicolor mode distributes variants without creating new slots.
const uniformPreview = buildVisualItems(variants, manyColors, variants[0].id);
assert.equal(uniformPreview.length, 6);
assert.ok(uniformPreview.every(i => i.slug === manyColors[7].slug));
const multiPreview = buildVisualItems(variants, manyColors, null, 'multi');
assert.equal(multiPreview.length, 6);
assert.equal(new Set(multiPreview.map(i => i.slug)).size, 6);
assert.ok(multiPreview.every(i => manyColors.slice(2).some(p => p.slug === i.slug)));
assert.equal(new Set(multiPreview.map(i => `${i.x}:${i.y}:${i.z}`)).size, 6);
const multiBlocks = buildVisualItems([...makeItems({ ...block, stock: 100 }, 1), ...makeItems({ ...block, name: 'Bloque marmoleado', slug: 'bloque-yoga-marmoleado', stock: 100 }, 1)],
  [{ ...block, stock: 100 }, { ...block, name: 'Bloque marmoleado', slug: 'bloque-yoga-marmoleado', stock: 100 }], null, 'multi');
assert.equal(new Set(multiBlocks.map(i => `${i.x}:${i.y}:${i.z}`)).size, 6);
const duplicateColor = [...variants, { ...variants[1], id: 'latest-same-color' }];
const lastRepeated = buildVisualItems(duplicateColor, manyColors, null, 'uniform');
assert.ok(lastRepeated.every(i => i.color === variants[1].color));
assert.equal(duplicateColor.length, 9);
console.log('Preview modes: latest color replacement, six multicolor variants and unchanged order passed.');

console.log('Six-station preview: fixed layout, unlimited visual-independent quantities, mixed types and colors passed.');

for (let i = 0; i < 6; i++) {
  assert.equal(displayPlacement('mat', i).y, 0);
  assert.ok(displayPlacement('ball', i).y > 0);
  assert.ok(displayPlacement('ball', i).z >= -.12 && displayPlacement('ball', i).z <= .10);
  assert.ok(displayPlacement('ball', i).x >= -2.80 && displayPlacement('ball', i).x <= -2.36);
  for (const kind of ['block', 'dumbbells', 'ankleWeights', 'triangle', 'generic']) {
    const p = displayPlacement(kind, i);
    assert.ok(p.y >= .82 && p.y <= 2.62);
    assert.ok(p.x >= .245 && p.x <= 2.995);
    assert.equal(p.z, -2.45);
  }
  assert.equal(displayPlacement('ring', i).tiltZ, Math.PI / 2);
  assert.equal(displayPlacement('bar', i).tiltZ, Math.PI / 2);
}
console.log('Storage layout: mats on floor, balls in left-wall basket below rings, accessories on shelves and racks passed.');

const plainBlock = { ...block, slug: 'bloque-yoga-espuma-negro', name: 'Bloque de Yoga Alta Densidad', stock: 99 };
const marbleBlock = { ...block, slug: 'bloque-yoga-marmoleado-negro', name: 'Bloque de Yoga Marmoleado', stock: 99 };
const twoBlocks = buildVisualItems([...makeItems(plainBlock, 1), ...makeItems(marbleBlock, 1)], [plainBlock, marbleBlock]);
assert.equal(twoBlocks.length, 6);
assert.equal(new Set(twoBlocks.map(i => `${i.x}:${i.y}:${i.z}`)).size, 6);
assert.ok(twoBlocks.some(i => i.slug === plainBlock.slug));
assert.ok(twoBlocks.some(i => i.slug === marbleBlock.slug));
const oneKgDumbbell = { ...base, name: 'Mancuerna Capsula 1 kg', slug: 'mancuerna-capsula-1kg' };
const heavierDumbbell = { ...base, name: 'Mancuerna Capsula 2.5 kg', slug: 'mancuerna-capsula-2-5kg' };
const oneKgAnkle = { ...base, name: 'Polainas 1 kg', slug: 'polainas-1kg' };
const halfKgAnkle = { ...base, name: 'Polainas 0.5 kg', slug: 'polainas-0-5kg' };
assert.equal(displayZone(oneKgDumbbell), 'dumbbells-mat');
assert.equal(displayZone(heavierDumbbell), 'dumbbells');
assert.equal(displayZone(oneKgAnkle), 'ankleWeights-mat');
assert.equal(displayZone(halfKgAnkle), 'ankleWeights');
const floorAccessories = [oneKgDumbbell, heavierDumbbell, oneKgAnkle, halfKgAnkle];
const layout = buildVisualItems(floorAccessories.flatMap(p => makeItems(p, 1)), floorAccessories);
assert.equal(layout.length, 24);
assert.equal(new Set(layout.map(i => `${i.x}:${i.y}:${i.z}`)).size, 24);
assert.ok(layout.filter(i => i.slug === oneKgDumbbell.slug || i.slug === oneKgAnkle.slug).every(i => i.z > -2.2));
console.log('Distinct blocks and 1 kg mat placements: no overlapping groups.');
