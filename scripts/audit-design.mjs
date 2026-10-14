// Revisión estática ligera para detectar regresiones en la identidad visual.
// No sustituye el build ni la revisión responsive en el navegador.
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const home = read("pages/index.tsx");
const hero = read("components/HeroSection.tsx");
const tailwind = read("tailwind.config.js");
const css = read("styles/globals.css");
const productCard = read("components/ProductCard.tsx");
const category = read("components/SeoCategoryPage.tsx");
const editor = read("components/MatCustomizer.tsx");

const checks = [
  ["paleta única", ["wine:", "cream:", "sand:", "blush:", "line:", "ink:"].every((key) => tailwind.includes(key))],
  ["fondo blanco puro", tailwind.includes('cream: "#FFFFFF"') && css.includes("--mm-cream: #ffffff;") && css.includes("background: var(--mm-cream)")],
  ["tipografía de título", tailwind.includes("display:") && css.includes(".mm-heading")],
  ["componentes unificados", [".mm-card", ".mm-button", ".mm-button-outline", ".mm-field"].every((key) => css.includes(key))],
  ["Hero en HTML inicial", home.includes("<HeroSection />") && !home.includes("showHero && <HeroSection")],
  ["único H1 del Hero", hero.includes("idx === mainTitleIndex") && hero.includes('<h1 className=') && hero.includes('<h2 className=')],
  ["H1 SSR dentro del Hero", hero.includes('<section aria-label="Hero de Melocotón Move" className="sr-only">') && hero.includes("Melocotón Move: tapetes de yoga y Pilates en México")],
  ["Hero editorial", hero.includes("melocoton-hero") && hero.includes("font-display") && hero.includes("bg-gradient-to-t")],
  ["menos movimiento", hero.includes("prefers-reduced-motion") && hero.includes("video.pause()")],
  ["sección editorial detrás de Hero", home.indexOf("<HeroSection />") >= 0 && home.indexOf("<HeroSection />") < home.indexOf('aria-labelledby="home-melocoton-movimiento"')],
  ["fondo solicitado de editorial", home.includes('aria-labelledby="home-melocoton-movimiento" className="w-full bg-gray-50')],
  ["cards del catálogo", productCard.includes('className="group flex h-full min-w-0 flex-col') && category.includes("mm-heading")],
  ["fotografía blanca y redondeada", productCard.includes("aspect-[3/4]") && productCard.includes("rounded-[24px] bg-white")],
  ["imagen lleva a ficha de variante", productCard.includes("href={productHref}") && productCard.includes("selectedProduct.slug")],
  ["comprar en escritorio y + táctil", productCard.includes("mm-product-desktop-buy") && productCard.includes("Comprar ahora") && productCard.includes("mm-product-quick-add") && css.includes("@media (hover: hover) and (min-width: 1024px)")],
  ["comprar reutiliza carrito existente", productCard.includes("addToCart({") && productCard.includes("maxStock: stock")],
  ["variantes actualizan imagen, precio y stock", productCard.includes("setSelectedSlug(variant.slug)") && productCard.includes("selectedProduct.image") && productCard.includes("selectedProduct.discountPrice") && productCard.includes("selectedProduct.stock")],
  ["favoritos de navegador", productCard.includes("FAVORITES_KEY") && productCard.includes("aria-pressed={isFavorite}")],
  ["personalizador intacto y visualmente integrado", editor.includes("MAT_PRICE = 1499") && editor.includes("bg-brand-cream") && editor.includes("WHATSAPP_PHONE")],
];

let failures = 0;
for (const [name, ok] of checks) {
  console.log(ok ? "OK" : "ERROR", name);
  if (!ok) failures += 1;
}
if (failures) {
  console.error("Auditoría de diseño: " + failures + " verificaciones fallidas.");
  process.exitCode = 1;
} else {
  console.log("Auditoría de diseño superada: " + checks.length + " controles estáticos.");
}
