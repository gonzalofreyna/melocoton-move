const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('lib/studio/catalog.ts', 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 }
}).outputText, context);
const { STATION_COUNT, STATIONS, buildVisualItems, displayPlacement, displayZone,
  groupAccessories, accessoryKind, unitPrice, studioQuotePrice, canAdd, overflowPlacement } = context.exports;

// Product-by-product discount: only each line reaching 5 units gets 15%.
assert.equal(studioQuotePrice(199, 4).finalUnit, 199);
assert.equal(studioQuotePrice(199, 4).total, 796);
assert.equal(studioQuotePrice(199, 5).finalUnit, 169.15);
assert.equal(studioQuotePrice(199, 5).total, 845.75);
assert.equal(studioQuotePrice(199, 5).savings, 149.25);
assert.equal(studioQuotePrice(199, 0).total, 0);
// Five units of a separate product do not change the four-unit line.
assert.equal(studioQuotePrice(199, 4).discounted, false);
assert.equal(studioQuotePrice(319, 5).discounted, true);
assert.equal(STATION_COUNT, 3);
assert.equal(STATIONS.length, 3);
assert.equal(JSON.stringify(STATIONS.map(s => s.x)), JSON.stringify([-2.05, 0, 2.05]));
assert.ok(STATIONS.every(s => s.z === -1.70));
// 182cm mats: rear edge at -2.61; mirror plane at -2.735 (~12.5cm gap).
assert.ok(STATIONS.every(s => s.z - .91 >= -2.63 && s.z - .91 <= -2.58));
const product = (name, slug, color = '#303030') => ({
  name, slug, colors: [color], category: 'accesorios', fullPrice: 319, stock: 100,
});
const select = p => ({ id: p.slug, slug: p.slug, color: p.colors[0], x: 0, z: 0, rotation: 0 });
const pol05 = product('Polainas 0.5 kg', 'polainas-0-5kg');
const pol15 = product('Polainas 1.5 kg', 'polainas-1-5kg');
const pol1 = product('Polainas 1 kg', 'polainas-1kg');
const block = product('Bloque de Yoga', 'bloque-yoga-negro');
const marble = product('Bloque de Yoga', 'bloque-yoga-marmoleado');
const ring = product('Magic Ring 32 cm', 'magic-ring-pilates-32cm');
const ring2 = product('Magic Ring 7 lb', 'magic-ring-pilates-7lb');
const bar = product('Barra Z 15 lb', 'barra-z-15lb');
const models = [pol05, pol15, pol1, block, marble, ring, ring2, bar];
assert.equal(groupAccessories(models).length, models.length);
assert.equal(displayZone(pol15), 'ankleWeights-heavy');
assert.equal(displayZone(pol1), 'ankleWeights-mat');
assert.equal(displayZone(marble), 'block-marble');
assert.equal(accessoryKind(ring), 'ring');
assert.equal(unitPrice({ ...ring, discountPrice: 290 }), 290);
assert.equal(canAdd({ ...ring, stock: 0 }, []), false);

const layout = buildVisualItems(models.map(select), models);
assert.equal(layout.length, models.length * STATION_COUNT);
assert.equal(new Set(layout.map(i => i.id)).size, layout.length);
assert.equal(new Set(layout.map(i => i.x + ':' + i.y + ':' + i.z)).size, layout.length);
for (const p of models) assert.equal(layout.filter(i => i.slug === p.slug).length, 3, p.name);
const ball = product('Mini Ball', 'mini-ball-pilates-rosa');
assert.equal(buildVisualItems([select(ball)], [ball]).length, 3);
assert.ok([0, 1, 2].every(i => displayPlacement('ball', i).y < displayPlacement('block', i).y));
assert.ok([0, 1, 2].every(i => displayPlacement('ball', i).x === -2.79));
assert.ok([0, 1, 2].every(i => displayPlacement('ball', i).z >= .7));
assert.ok([0, 1, 2].every(i => displayPlacement('block', i).x < -2.5));
assert.ok([0, 1, 2].every(i => displayPlacement('ring', i).z < -.8));
assert.ok([0, 1, 2].every(i => displayPlacement('ring', i).y > 2.5));
assert.ok([0, 1, 2].every(i => displayPlacement('ring', i).y > displayPlacement('bar', i).y + 1.5));

const pink = product('Polainas 0.5 kg', 'polainas-0-5kg-rosa', '#F8B0C6');
assert.equal(groupAccessories([pol05, pink]).length, 1);
const colors = buildVisualItems([select(pol05), select(pink)], [pol05, pink]);
assert.equal(colors.length, STATION_COUNT);
assert.equal(new Set(colors.map(i => i.color)).size, 1);
assert.ok(colors.every(i => i.color === pink.colors[0]), 'All three copies use the last chosen color');
assert.equal(buildVisualItems([select(pink), select(pol05)], [pol05, pink]).filter(i => i.color === pol05.colors[0]).length, 3);
const ordered = buildVisualItems(models.slice().reverse().map(select), models);
assert.equal(new Set(ordered.map(i => i.x + ':' + i.y + ':' + i.z)).size, layout.length);

const many = Array.from({ length: 32 }, (_, i) => product('Modelo distinto ' + i, 'modelo-independiente-' + i));
const overflow = buildVisualItems(many.map(select), many);
assert.equal(overflow.length, 32 * STATION_COUNT);
assert.equal(new Set(overflow.map(i => i.x + ':' + i.y + ':' + i.z)).size, overflow.length);
assert.ok(overflow.some(i => i.x > 3.2));
assert.equal(overflowPlacement(0, 0).z, overflowPlacement(0, 2).z);

const mat = { ...product('Tapete', 'mat-personalizado'), category: 'mat' };
assert.equal(displayZone(mat), 'mat');
assert.equal(buildVisualItems([select(mat)], [mat]).length, 3);
console.log('Studio catalog: three aligned stations, independent products, color variants, shelves, basket and 32-model overflow passed.');
