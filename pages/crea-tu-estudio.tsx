import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import type { Product } from '../lib/fetchProducts';
import { accessoryKind, clampPosition, positionLimit, canAdd, colorName, groupAccessories, MAX_ITEMS, nextPosition, unitPrice, type StudioItem } from '../lib/studio/catalog';
const StudioScene = dynamic(() => import('../components/studio/StudioScene'), { ssr: false, loading: () => <div className="h-[360px] sm:h-[520px] lg:h-[600px] rounded-2xl bg-brand-sand grid place-items-center">Preparando tu espacio…</div> });
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

function ColorOptions({ products, value, items, excludingId, onChange }: { products: Product[]; value: string; items: StudioItem[]; excludingId?: string; onChange: (p: Product, color: string) => void }) {
  return <div className="flex flex-wrap gap-1" aria-label="Colores disponibles">
    {products.flatMap(p => (p.colors.length ? p.colors : ['']).map(color => {
      const key = `${p.slug}|${color}`; const available = canAdd(p, items, excludingId);
      return <button key={key} type="button" disabled={!available} aria-pressed={value === key} aria-label={`${colorName(color)}${available ? '' : ' · sin existencia disponible'}`} title={colorName(color)} onClick={() => onChange(p, color)} className={`h-11 w-11 grid place-items-center rounded-full border-2 disabled:opacity-30 ${value === key ? 'border-brand-wine' : 'border-transparent'}`}>
        <span className="h-7 w-7 rounded-full border border-black/15" style={{ backgroundColor: color || '#c5b6a6' }} />
      </button>;
    }))}
  </div>;
}
function ProductPicker({ variants, items, onAdd }: { variants: Product[]; items: StudioItem[]; onAdd: (p: Product, color: string) => void }) {
  const [choice, setChoice] = useState<{ slug: string; color: string } | null>(null);
  const product = variants.find(p => p.slug === choice?.slug) || variants.find(p => canAdd(p, items)) || variants[0];
  const color = choice?.slug === product.slug && product.colors.includes(choice.color) ? choice.color : product.colors[0] || '';
  const available = canAdd(product, items) && items.length < MAX_ITEMS;
  return <article className="rounded-2xl border border-brand-line p-4 bg-white">
    <div className="flex gap-4"><img src={product.image} alt={product.name} className="h-20 w-20 rounded-xl object-contain bg-[#faf8f5]" /><div className="flex-1"><h3 className="text-sm font-semibold leading-5">{product.name}</h3><p className="mt-2 text-sm">{money(unitPrice(product))} <span className="text-brand-muted">/ pieza</span></p></div></div>
    <div className="mt-3"><ColorOptions products={variants} items={items} value={`${product.slug}|${color}`} onChange={(p, c) => setChoice({ slug: p.slug, color: c })} /><p className="text-xs text-brand-muted mt-1">{colorName(color)}</p></div>
    <button type="button" disabled={!available} onClick={() => onAdd(product, color)} className="mm-button w-full mt-3 disabled:opacity-40">{available ? 'Añadir al estudio' : items.length >= MAX_ITEMS ? 'Límite de la demo alcanzado' : 'Sin existencia disponible'}</button>
  </article>;
}
export default function CreaTuEstudio() {
  const { products, loading, error, refresh } = useProducts();
  const groups = useMemo(() => groupAccessories(products), [products]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const visibleGroups = groups.filter(g => (filter === 'all' || g[0].category === filter) && g.some(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const [items, setItems] = useState<StudioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'perspective' | 'top'>('perspective');
  const [reset, setReset] = useState(0);
  const [message, setMessage] = useState('');
  const selected = items.find(i => i.id === selectedId);
  const selectedProduct = products.find(p => p.slug === selected?.slug);
  const selectedVariants = groups.find(g => g.some(p => p.slug === selected?.slug)) || [];
  const summary = useMemo(() => {
    const result = new Map<string, { product: Product; color: string; quantity: number }>();
    items.forEach(item => {
      const product = products.find(p => p.slug === item.slug); if (!product) return;
      const key = `${item.slug}|${item.color}`, row = result.get(key);
      if (row) row.quantity++; else result.set(key, { product, color: item.color, quantity: 1 });
    });
    return [...result.entries()];
  }, [items, products]);
  const limits = selectedProduct && selected ? positionLimit(selectedProduct, selected.rotation) : { x: 1.35, z: 1.35 };
  const total = summary.reduce((sum, [, row]) => sum + unitPrice(row.product) * row.quantity, 0);
  function add(product: Product, color: string) {
    if (!canAdd(product, items) || items.length >= MAX_ITEMS) return;
    const id = crypto.randomUUID();
    setItems(current => [...current, clampPosition(product, { id, slug: product.slug, color, ...(accessoryKind(product) === 'mat' ? { x: (current.filter(i => products.find(p => p.slug === i.slug)?.category === 'mat').length % 3 - 1) * .85, z: 0 } : nextPosition(current)), rotation: 0 })]);
    setSelectedId(id); setMessage(`${product.name}, ${colorName(color)}, añadido.`);
  }
  function updateSelected(change: Partial<StudioItem>) { setItems(current => current.map(i => i.id === selectedId ? clampPosition(products.find(p => p.slug === (change.slug || i.slug))!, { ...i, ...change }) : i)); }
  function remove(id: string) { setItems(current => current.filter(i => i.id !== id)); if (id === selectedId) setSelectedId(null); }
  return <>
    <Head><title>Crea tu estudio 3D | Melocotón Move</title><meta name="robots" content="noindex,nofollow" /></Head>
    <div className="bg-[#faf8f5] text-brand-ink pb-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-7"><div><p className="mm-eyebrow">Melocotón Move · Demo interactiva</p><h1 className="mm-heading text-4xl sm:text-5xl mt-3">Tu espacio, a tu manera.</h1><p className="mm-copy mt-3">Elige tus accesorios y tapetes y prueba sus colores en tu estudio.</p></div><a href="/arma-tu-studio" className="mm-text-link">Ir al cotizador</a></div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <section aria-label="Diseño de tu estudio" className="lg:sticky lg:top-28 min-w-0">
            <div className="relative"><StudioScene items={items} products={products} selectedId={selectedId} onSelect={setSelectedId} view={view} reset={reset} />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs">Estudio de ejemplo · 3.3 × 3.3 m</span>
              {!items.length && <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/90 p-4 text-center text-sm pointer-events-none">Tu estudio empieza aquí. Añade un accesorio del catálogo.</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3"><button type="button" className="mm-button-outline !px-4" aria-pressed={view === 'perspective'} onClick={() => { setView('perspective'); setReset(n => n + 1); }}>Perspectiva</button><button type="button" className="mm-button-outline !px-4" aria-pressed={view === 'top'} onClick={() => { setView('top'); setReset(n => n + 1); }}>Desde arriba</button><button type="button" className="mm-button-outline !px-4" onClick={() => setReset(n => n + 1)}>Restablecer vista</button></div>
            <p className="text-xs text-brand-muted leading-5 mt-3">Arrastra para girar · Pellizca o usa la rueda para acercar · Toca un accesorio para editarlo.</p>
            {selected && selectedProduct && <div className="rounded-2xl bg-white border border-brand-line p-5 mt-4">
              <div className="flex justify-between gap-3"><h2 className="font-semibold text-sm">{selectedProduct.name}</h2><button className="text-sm underline min-h-11" onClick={() => remove(selected.id)}>Quitar</button></div>
              <ColorOptions products={selectedVariants} items={items} excludingId={selected.id} value={`${selected.slug}|${selected.color}`} onChange={(p, color) => { if (canAdd(p, items, selected.id)) updateSelected({ slug: p.slug, color }); }} />
              <p className="text-xs text-brand-muted mt-1">{colorName(selected.color)} · {money(unitPrice(selectedProduct))}</p>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <label className="text-xs">Posición horizontal<input className="block w-full h-11 accent-[#674650]" type="range" min={-limits.x} max={limits.x} step="0.01" value={selected.x} onChange={e => updateSelected({ x: Number(e.target.value) })} /></label>
                <label className="text-xs">Posición en profundidad<input className="block w-full h-11 accent-[#674650]" type="range" min={-limits.z} max={limits.z} step="0.01" value={selected.z} onChange={e => updateSelected({ z: Number(e.target.value) })} /></label>
                <button className="mm-button-outline !px-4 self-center" onClick={() => updateSelected({ rotation: selected.rotation + Math.PI / 4 })}>Girar 45°</button>
              </div>
            </div>}
            <p className="text-xs text-brand-muted leading-5 mt-4">Representaciones simplificadas y medidas de referencia; los tapetes con medidas de empaque se muestran a 67.3 × 181.3 cm. Los pares se añaden como una unidad de venta con dos piezas. Los estampados, marmoleados y acabados muestran el color base registrado; el acabado real se ve en la foto del producto. Esta demo admite hasta {MAX_ITEMS} piezas y no guarda tu diseño al salir.</p>
          </section>
          <aside className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="font-display text-2xl">Accesorios y tapetes</h2><span className="text-xs text-brand-muted">Colores del catálogo</span></div>
            <label className="block text-sm">Buscar producto<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tapete, polainas, mancuernas…" className="mm-field w-full mt-2" /></label>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar catálogo">{[['all', 'Todos'], ['accesorios', 'Accesorios'], ['mat', 'Tapetes']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={filter === value ? 'mm-button !px-4' : 'mm-button-outline !px-4'}>{label}</button>)}</div>
            {loading && <p role="status">Cargando catálogo…</p>}
            {error && <div role="alert" className="rounded-xl border border-brand-line p-4">No pudimos cargar los accesorios.<button onClick={() => void refresh()} className="block underline min-h-11">Reintentar</button></div>}
            {!loading && !error && !visibleGroups.length && <p>No hay productos que coincidan con tu búsqueda.</p>}
            {!loading && !error && visibleGroups.map(variants => <ProductPicker key={variants[0].name} variants={variants} items={items} onAdd={add} />)}
            <section className="bg-white border border-brand-line rounded-2xl p-5" aria-label="Tu selección">
              <h2 className="font-display text-2xl">Tu selección <span className="text-sm font-sans">({items.length})</span></h2>
              {!items.length && <p className="text-sm text-brand-muted mt-3">Añade tu primera pieza para comenzar.</p>}
              <ul className="divide-y divide-brand-line mt-2">{summary.map(([key, row]) => <li key={key} className="py-3"><button className="text-left text-sm leading-5 underline decoration-brand-line" onClick={() => setSelectedId(items.find(i => `${i.slug}|${i.color}` === key)!.id)}>{row.product.name}</button><p className="text-xs text-brand-muted mt-1">{colorName(row.color)} · {money(unitPrice(row.product))} / pieza</p><div className="flex items-center justify-between mt-2"><div className="flex items-center gap-3"><button className="h-11 w-11 border border-brand-line rounded-full" aria-label={`Quitar una pieza de ${row.product.name}, ${colorName(row.color)}`} onClick={() => remove(items.find(i => `${i.slug}|${i.color}` === key)!.id)}>−</button><span>{row.quantity}</span><button className="h-11 w-11 border border-brand-line rounded-full disabled:opacity-30" aria-label={`Añadir una pieza de ${row.product.name}, ${colorName(row.color)}`} disabled={!canAdd(row.product, items) || items.length >= MAX_ITEMS} onClick={() => add(row.product, row.color)}>+</button></div><span className="text-sm">{money(unitPrice(row.product) * row.quantity)}</span></div></li>)}</ul>
              <div className="flex justify-between border-t border-brand-line pt-4 mt-3 font-semibold"><span>Subtotal estimado</span><span>{money(total)}</span></div><p className="text-xs leading-5 text-brand-muted mt-2">Precios del catálogo, antes de promociones por cantidad. Esta demo no genera pedidos ni reserva inventario.</p>
            </section>
          </aside>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{message}</p>
      </div>
    </div>
  </>;
}
