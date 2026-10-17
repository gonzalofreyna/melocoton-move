// Run: node scripts/test-openai-ads-conversion.cjs
// Uses local TypeScript compiler to test the exact helper consumed by /success.
// No Stripe calls, network requests, or OpenAI SDK calls.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../lib/openaiAdsPurchase.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const { reportOpenAiPurchase } = exportsObject;
const valid = { ok: true, orderId: "cs_live_abc123", amountTotal: 139900, currency: "mxn", enabled: true };

function harness(accepted = true) {
  const calls = [];
  const sent = new Set();
  const deps = {
    consent: () => accepted,
    previouslySent: (key) => sent.has(key),
    markSent: (key) => sent.add(key),
    measure: (...args) => calls.push(args),
  };
  return { calls, sent, deps };
}
function rejects(label, overrides, accepted = true) {
  const h = harness(accepted);
  assert.equal(reportOpenAiPurchase({ ...valid, ...overrides }, h.deps), false, label);
  assert.equal(h.calls.length, 0, label + ": no pixel calls");
}

rejects("No consent", {}, false);
rejects("No valid Stripe confirmation", { ok: false });
rejects("Test-mode Stripe session", { orderId: "cs_test_abc123" });
rejects("Missing session", { orderId: null });
rejects("Disabled pixel", { enabled: false });
rejects("Invalid amount", { amountTotal: NaN });
rejects("Negative amount", { amountTotal: -1 });
rejects("Missing currency", { currency: "" });

const h = harness();
assert.equal(reportOpenAiPurchase(valid, h.deps), true);
assert.equal(h.calls.length, 1);
const [command, event, payload, options] = h.calls[0];
assert.equal(command, "measure");
assert.equal(event, "order_created");
assert.equal(payload.type, "contents");
assert.equal(payload.amount, 139900);
assert.equal(payload.currency, "MXN");
assert.equal(options.event_id, "cs_live_abc123");
assert.equal(reportOpenAiPurchase(valid, h.deps), false, "repeated receipt does not resend");
assert.equal(h.calls.length, 1, "only one conversion in same browser storage");
console.log("PASS: 10 checks — no external requests and no charges.");
