import test from "node:test";
import assert from "node:assert/strict";
import { priceCart } from "./pricing.mjs";

const catalog = [
  { slug: "calceta-basic-negra", name: "Basic", category: "Calcetas", fullPrice: 200, stock: 20 },
  { slug: "calceta-curly-rosa", name: "Curly", category: "calcetas", fullPrice: 200, discountPrice: 180, stock: 20 },
  { slug: "tapete", name: "Tapete", category: "Tapetes", fullPrice: 1000, stock: 20 },
  { slug: "crea-tu-mat", name: "Mat personalizado", category: "Tapetes", fullPrice: 1399, stock: 20 },
];
const cart = (items, opts = { enabled: true, minQty: 5, percent: 15 }) => priceCart(items, catalog, opts);

test("combina modelos y variantes de una misma categoría", () => {
  const result = cart([{ slug: "calceta-basic-negra", quantity: 3 }, { slug: "calceta-curly-rosa", quantity: 2 }]);
  assert.equal(result.subtotalCents, 96000);
  assert.equal(result.totalCents, 81600);
  assert.equal(result.discountCents, 14400);
  assert.ok(result.items.every((item) => item.wholesale));
});
test("no combina categorías diferentes", () => {
  const result = cart([{ slug: "calceta-basic-negra", quantity: 3 }, { slug: "tapete", quantity: 2 }]);
  assert.equal(result.discountCents, 0);
});
test("calcula sobre precio promocional vigente", () => {
  const result = cart([{ slug: "calceta-curly-rosa", quantity: 5 }]);
  assert.equal(result.totalCents, 76500);
});
test("no aplica mayoreo a Crea tu Mat ni lo cuenta para activar la categoría", () => {
  const result = cart([{ slug: "tapete", quantity: 4 }, { slug: "crea-tu-mat", quantity: 2 }]);
  assert.equal(result.discountCents, 0);
});
test("permite apagar mayoreo", () => {
  const result = cart([{ slug: "calceta-basic-negra", quantity: 5 }], { enabled: false, minQty: 5, percent: 15 });
  assert.equal(result.discountCents, 0);
});
test("agrupa slugs repetidos y valida inventario", () => {
  const result = cart([{ slug: "calceta-basic-negra", quantity: 2 }, { slug: "calceta-basic-negra", quantity: 3 }]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].quantity, 5);
  assert.throws(() => cart([{ slug: "tapete", quantity: 21 }]), /hasta 20/);
});
