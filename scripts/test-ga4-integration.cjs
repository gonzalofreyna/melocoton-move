// Smoke checks for the first GA4 implementation; no network requests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ga = fs.readFileSync("components/Ga4Analytics.tsx", "utf8");
const app = fs.readFileSync("pages/_app.tsx", "utf8");
assert.match(ga, /NEXT_PUBLIC_GA4_MEASUREMENT_ID/);
assert.match(ga, /localStorage\.getItem\(ADS_CONSENT_KEY\) === "accepted"/);
assert.match(ga, /analytics_storage: "denied"/);
assert.match(ga, /send_page_view: false/);
assert.match(ga, /router\.asPath, router\.isReady/);
assert.doesNotMatch(ga, /routeChangeComplete/);
assert.match(ga, /requestAnimationFrame/);
assert.match(ga, /page_location: fullUrl/);
assert.match(ga, /ga-disable-/);
assert.match(app, /<Ga4Analytics \/>/);
assert.match(ga, /addEventListener\("pageshow", onPageShow\)/);
assert.match(ga, /if \(!event\.persisted\) return;/);
assert.match(ga, /lastPage = "";/);
console.log("PASS: 13 GA4 integration smoke checks (no network calls)");
