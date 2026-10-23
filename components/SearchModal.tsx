"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Search, Sparkles, ShoppingBag, X } from "lucide-react";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";
import type { Product } from "../lib/fetchProducts";

type Goal = "general" | "pilates" | "yoga" | "studio" | "regalo";

const GOALS: { id: Goal; label: string; terms: string[] }[] = [
  { id: "general", label: "Explorar", terms: [] },
  { id: "pilates", label: "Practicar Pilates", terms: ["pilates", "aro", "pelota", "banda", "mat", "reformer", "calceta", "polaina"] },
  { id: "yoga", label: "Practicar yoga", terms: ["yoga", "mat", "bloque", "strap", "correa", "banda"] },
  { id: "studio", label: "Equipar mi estudio", terms: ["reformer", "silla", "barril", "pilates", "equipo", "studio"] },
  { id: "regalo", label: "Regalar movimiento", terms: ["calceta", "mat", "aro", "banda", "bloque", "botella"] },
];

const normalize = (value: string) =>
  value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const isAvailable = (p: Product) => p.stock === undefined || p.stock > 0;
// Los artículos que requieren configuración individual se compran desde su flujo dedicado.
const requiresConfiguration = (p: Product) => /personalizad|a tu medida|con tu logo/i.test([p.name, p.category, ...(p.tags || [])].join(" "));
const validPrice = (p: Product) => {
  const value = p.discountPrice ?? p.fullPrice;
  return Number.isFinite(value) && value > 0 ? value : null;
};
const priceText = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(value);

function scoreProduct(product: Product, query: string, goal: Goal) {
  const haystack = normalize([product.name, product.category, product.description, ...(product.tags || []), ...(product.highlights || [])].join(" "));
  const terms = normalize(query).split(/\s+/).filter((word) => word.length > 2);
  const name = normalize(product.name);
  let score = 0;
  for (const word of terms) {
    if (name.includes(word)) score += 8;
    else if (haystack.includes(word)) score += 3;
  }
  const selectedGoal = GOALS.find((g) => g.id === goal);
  if (selectedGoal && goal !== "general") {
    for (const term of selectedGoal.terms) {
      if (haystack.includes(term)) score += name.includes(term) ? 3 : 1;
    }
  }
  if (product.featured) score += 1;
  return score;
}

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { products, loading, error } = useProducts();
  const { addToCart, cart } = useCart();
  const [query, setQuery] = useState("");
  const [goal, setGoal] = useState<Goal>("general");
  const [budget, setBudget] = useState("");
  const [mode, setMode] = useState<"search" | "assistant">("assistant");
  const [selected, setSelected] = useState<string[]>([]);
  const maxBudget = Number(budget);
  const hasBudget = budget.trim() !== "" && Number.isFinite(maxBudget) && maxBudget > 0;
  const searching = query.trim().length > 0;

  const recommended = useMemo(() => {
    return products
      .filter((p) => isAvailable(p) && validPrice(p) !== null)
      .map((p) => ({ product: p, score: scoreProduct(p, query, goal) }))
      .filter(({ product, score }) =>
        (!hasBudget || (validPrice(product) as number) <= maxBudget) &&
        (mode === "search" ? searching && score > 0 : (!searching && goal === "general") || score > 0)
      )
      .sort((a, b) => b.score - a.score || (a.product.name.localeCompare(b.product.name, "es")))
      .slice(0, 12)
      .map(({ product }) => product);
  }, [products, query, goal, mode, searching, hasBudget, maxBudget]);

  useEffect(() => {
    setSelected((current) => current.filter((slug) => recommended.some((p) => p.slug === slug)));
  }, [recommended]);

  const kit = useMemo(() => recommended.filter((p) => selected.includes(p.slug)), [recommended, selected]);
  const kitTotal = kit.reduce((sum, p) => sum + (validPrice(p) || 0), 0);
  const kitOverBudget = hasBudget && kitTotal > maxBudget;

  const addProduct = (p: Product) => {
    const price = validPrice(p);
    if (price === null || !isAvailable(p) || requiresConfiguration(p)) return;
    addToCart({
      slug: p.slug,
      sku: p.sku,
      category: p.category,
      name: p.name,
      price,
      image: p.image,
      maxStock: p.stock,
      shippingType: p.shippingType || "standard",
      freeShipping: true,
    });
  };

  const addKit = () => {
    if (kit.length === 0 || kitOverBudget) return;
    for (const p of kit) {
      if (p.stock !== undefined && (cart.find((item) => item.slug === p.slug)?.quantity || 0) >= p.stock) continue;
      addProduct(p);
    }
    setSelected([]);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="presentation" className="fixed inset-0 z-[999] flex items-start justify-center bg-black/50 p-3 pt-10 backdrop-blur-sm md:p-10" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="Buscar y descubrir productos" className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-brand-line bg-brand-cream shadow-editorial-lg">
        <header className="flex items-center justify-between gap-3 border-b border-brand-line px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-muted">Melocotón Move</p>
            <h2 className="text-xl font-semibold text-brand-ink">Encuentra tu movimiento</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar buscador" className="rounded-full p-2 text-brand-ink hover:bg-brand-sand"><X size={21} /></button>
        </header>
        <div className="overflow-y-auto px-4 py-4 md:px-6">
          <div className="mb-4 flex gap-2" role="group" aria-label="Modo de búsqueda">
            <button type="button" aria-pressed={mode === "assistant"} onClick={() => setMode("assistant")} className={`rounded-full px-4 py-2 text-sm ${mode === "assistant" ? "bg-brand-ink text-white" : "border border-brand-line text-brand-ink"}`}><Sparkles size={15} className="mr-2 inline" />Recomendaciones</button>
            <button type="button" aria-pressed={mode === "search"} onClick={() => setMode("search")} className={`rounded-full px-4 py-2 text-sm ${mode === "search" ? "bg-brand-ink text-white" : "border border-brand-line text-brand-ink"}`}><Search size={15} className="mr-2 inline" />Buscar</button>
          </div>
          <label htmlFor="shopping-assistant-query" className="sr-only">¿Qué estás buscando?</label>
          <input id="shopping-assistant-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej. accesorios para empezar Pilates en casa" className="mm-field w-full rounded-2xl border border-brand-line bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted" autoFocus />
          {mode === "assistant" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-brand-ink">¿Para qué los necesitas?</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g.id} type="button" aria-pressed={goal === g.id} onClick={() => setGoal(g.id)} className={`rounded-full border px-3 py-2 text-sm transition-colors ${goal === g.id ? "border-brand-ink bg-brand-ink text-white" : "border-brand-line bg-white text-brand-ink hover:bg-brand-sand"}`}>{g.label}</button>
                ))}
              </div>
              <label className="block text-sm text-brand-ink">Presupuesto máximo (opcional)
                <input type="number" min="1" step="1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Ej. 1500 MXN" className="mm-field mt-1 w-full rounded-xl border border-brand-line bg-white px-3 py-2" />
              </label>
              <p className="text-xs text-brand-muted">Sugerencias basadas en el catálogo, no generadas por IA. Para productos con personalización o variantes, confirma los detalles en su ficha. El presupuesto también se aplica al total del kit.</p>
            </div>
          )}
          <div className="mb-3 mt-5 flex items-center justify-between">
            <h3 className="font-medium text-brand-ink">{mode === "assistant" ? "Productos recomendados" : "Resultados de búsqueda"}</h3>
            <span className="text-xs text-brand-muted">{recommended.length} resultados</span>
          </div>
          {loading ? <p className="py-8 text-center text-brand-muted">Cargando productos…</p> : error ? <p className="py-8 text-center text-red-700">No pudimos cargar el catálogo: {error}</p> : recommended.length === 0 ? (
            <p className="rounded-2xl border border-brand-line bg-white p-6 text-center text-brand-muted">No encontramos productos disponibles con esos filtros. Prueba otra búsqueda o presupuesto.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recommended.map((p) => {
                const chosen = selected.includes(p.slug);
                const inCart = cart.find((item) => item.slug === p.slug)?.quantity || 0;
                const canAdd = !requiresConfiguration(p) && (p.stock === undefined || inCart < p.stock);
                return (
                  <article key={p.slug} className="flex gap-3 rounded-2xl border border-brand-line bg-white p-3">
                    <Link href={`/${p.slug}`} onClick={onClose} className="h-24 w-24 flex-none overflow-hidden rounded-xl border border-brand-line"><img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" /></Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/${p.slug}`} onClick={onClose} className="line-clamp-2 text-sm font-medium text-brand-ink hover:underline">{p.name}</Link>
                      <p className="mt-1 text-sm font-semibold text-brand-ink">{priceText(validPrice(p) as number)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => addProduct(p)} disabled={!canAdd} className="rounded-full bg-brand-ink px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={13} className="mr-1 inline" />{requiresConfiguration(p) ? "Configurar en ficha" : canAdd ? "Agregar" : "Sin stock"}</button>
                        {mode === "assistant" && !requiresConfiguration(p) && <label className="flex cursor-pointer items-center gap-1 text-xs text-brand-ink"><input type="checkbox" checked={chosen} onChange={() => setSelected((prev) => chosen ? prev.filter((slug) => slug !== p.slug) : [...prev, p.slug])} /> Incluir en kit</label>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        {mode === "assistant" && selected.length > 0 && (
          <footer className="flex items-center justify-between gap-3 border-t border-brand-line bg-white px-5 py-4">
            <div><p className="text-sm font-semibold text-brand-ink">Tu kit · {kit.length} productos</p><p className="text-sm text-brand-muted">{priceText(kitTotal)} · envío gratis{kitOverBudget ? " · supera tu presupuesto" : ""}</p></div>
            <button type="button" onClick={addKit} disabled={kit.length === 0 || kitOverBudget} className="rounded-full bg-brand-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Agregar kit al carrito</button>
          </footer>
        )}
      </section>
    </div>
  );
}
