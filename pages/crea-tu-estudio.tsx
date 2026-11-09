import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../context/ProductsContext';
import type { Product } from '../lib/fetchProducts';
import { MAT_DIMENSIONS, MAT_PRICE, matShapes, solidColors, solidColorNames, type MatShape } from '../lib/mat-config';
import { buildVisualItems, canAdd, colorName, groupAccessories, unitPrice, type StudioItem } from '../lib/studio/catalog';
const MobileStudio = dynamic(() => import('../components/studio/MobileStudio'), { ssr: false });
const StudioScene = dynamic(() => import('../components/studio/StudioScene'), { ssr: false, loading: () => <div className="h-[360px] sm:h-[520px] lg:h-[600px] rounded-2xl bg-brand-sand grid place-items-center">Preparando tu espacio…</div> });
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

function ColorOptions({ products, value, items, excludingId, onChange }: { products: Product[]; value: string; items: StudioItem[]; excludingId?: string; onChange: (p: Product, color: string) => void }) {
  return <div className="flex flex-wrap gap-1" aria-label="Colores disponibles">
    {products.flatMap(p => (p.colors.length ? p.colors : ['']).map(color => {
      const key = `${p.slug}|${color}`; const available = true; // Preview colors are not inventory reservations.
      return <button key={key} type="button" aria-pressed={value === key} aria-label={colorName(color)} title={colorName(color)} onClick={() => onChange(p, color)} className={`h-11 w-11 grid place-items-center rounded-full border-2 disabled:opacity-30 ${value === key ? 'border-brand-wine' : 'border-transparent'}`}>
        <span className="h-7 w-7 rounded-full border border-black/15" style={{ backgroundColor: color || '#c5b6a6' }} />
      </button>;
    }))}
  </div>;
}
function ProductPicker({ variants, items, onAdd }: { variants: Product[]; items: StudioItem[]; onAdd: (p: Product, color: string) => void }) {
  const selected = items.filter(i => variants.some(v => v.slug === i.slug));
  const product = variants.find(v => v.slug === selected[selected.length - 1]?.slug) || variants[0];
  return <article className="p-3 bg-white rounded-b-xl">
    <div className="flex gap-4"><img src={product.image} alt={product.name} className="h-20 w-20 rounded-xl object-contain bg-[#faf8f5]" /><div className="flex-1"><h3 className="text-sm font-semibold leading-5">{product.name}</h3><p className="mt-2 text-sm">{money(unitPrice(product))} <span className="text-brand-muted">/ pieza</span></p></div></div>
    <p className="mt-3 text-xs text-brand-muted">Toca un color para verlo inmediatamente en el modelo.</p>
    <div className="mt-2 flex flex-wrap gap-1">
      {variants.flatMap(p => (p.colors.length ? p.colors : ['']).map(color => {
        const active = selected.some(i => i.slug === p.slug && i.color === color);
        return <button key={p.slug + '|' + color} type="button" title={colorName(color)} aria-label={colorName(color)} aria-pressed={active}
          onClick={() => onAdd(p, color)} className={'grid h-11 w-11 place-items-center rounded-full border-2 ' + (active ? 'border-brand-wine' : 'border-transparent')}>
          <span className="h-7 w-7 rounded-full border border-black/15" style={{ backgroundColor: /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#c5b6a6' }} />
        </button>;
      }))}
    </div>
    <p className="mt-2 text-xs text-brand-muted">Al elegir un color, cambian los tres ejemplares de este producto. Las cantidades se deciden al finalizar.</p>
  </article>;
}
export default function CreaTuEstudio() {
  const { products, loading, error, refresh } = useProducts();
  // Match media after hydration so just one WebGL scene is mounted at a time.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const groups = useMemo(() => groupAccessories(products.filter(p => p.category.trim().toLowerCase() !== 'mat')), [products]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const visibleGroups = groups.filter(g => (filter === 'all' || g[0].category === filter) && g.some(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  // Design selections are never order quantities: one entry per color only.
  const [items, setItems] = useState<StudioItem[]>([]);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [matShape, setMatShape] = useState<MatShape>('bala');
  const [matColor, setMatColor] = useState('#741D32');
  const [matQuantity, setMatQuantity] = useState(0);
  const [matEnabled, setMatEnabled] = useState(false);
  const updateMat = (change: { shape?: MatShape; color?: string }) => {
    if (change.shape) setMatShape(change.shape);
    if (change.color) setMatColor(change.color);
    setMatEnabled(true);
    setMatQuantity(q => Math.max(3, q));
    setSelectedId('studio-mat');
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'perspective' | 'top'>('perspective');
  const [floorColor, setFloorColor] = useState('#b99976');
  const [wallColor, setWallColor] = useState('#eee8dd');
  const [reset, setReset] = useState(0);
  const [message, setMessage] = useState('');
  const selected = items.find(i => i.id === selectedId);
  const selectedProduct = products.find(p => p.slug === selected?.slug);
  const selectedVariants = groups.find(g => g.some(p => p.slug === selected?.slug)) || [];
  const visualItems = useMemo(() => buildVisualItems(items, products, selectedId), [items, products, selectedId]);
  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const visual of visualItems) {
      const key = visual.slug + '|' + visual.color;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const unique = new Map<string, { product: Product; color: string; quantity: number }>();
    for (const item of items) {
      const product = products.find(p => p.slug === item.slug);
      if (!product) continue;
      const key = item.slug + '|' + item.color;
      const suggested = counts.get(key) ?? 0;
      const quantity = Math.max(0, Math.min(orderQuantities[key] ?? suggested, product.stock == null ? 999 : product.stock));
      unique.set(key, { product, color: item.color, quantity });
    }
    return [...unique.entries()];
  }, [items, products, visualItems, orderQuantities]);
  const total = summary.reduce((sum, [, row]) => sum + unitPrice(row.product) * row.quantity, 0) + matQuantity * MAT_PRICE;
  function add(product: Product, color: string) {
    // One color per product model; all three visual copies change together.
    const family = groups.find(g => g.some(p => p.slug === product.slug)) || [product];
    const familySlugs = new Set(family.map(p => p.slug));
    const key = product.slug + '|' + color;
    const existing = items.find(i => familySlugs.has(i.slug));
    const id = existing?.id || crypto.randomUUID();
    setItems(current => [
      ...current.filter(i => !familySlugs.has(i.slug)),
      { id, slug: product.slug, color, x: 0, z: 0, rotation: 0 }
    ]);
    setSelectedId(id);
    setOrderQuantities(current => { const next = { ...current }; delete next[key]; return next; });
    setMessage(product.name + ', ' + colorName(color) + ' aplicado a los tres ejemplares.');
  }
  function setOrderQuantity(key: string, quantity: number) {
    const item = items.find(i => i.slug + '|' + i.color === key);
    const product = products.find(p => p.slug === item?.slug);
    const capped = Math.max(0, Math.min(Math.floor(quantity), product?.stock == null ? 999 : product.stock));
    setOrderQuantities(current => ({ ...current, [key]: capped }));
  }
  function updateSelected(change: Partial<StudioItem>) {
    const original = items.find(i => i.id === selectedId);
    if (!original) return;
    const product = products.find(p => p.slug === (change.slug ?? original.slug));
    if (product && change.color !== undefined) {
      add(product, change.color);
      return;
    }
    setItems(current => current.map(i => i.id === selectedId ? { ...i, ...change } : i));
  }
  function remove(id: string) { setItems(current => current.filter(i => i.id !== id)); if (id === selectedId) setSelectedId(null); }
  const setMobileMatQuantity = (quantity: number) => {
    const next = Math.max(0, Math.floor(quantity));
    setMatQuantity(next);
    setMatEnabled(next > 0);
    if (!next && selectedId === 'studio-mat') setSelectedId(null);
  };
  if (isMobile === null) return <>
    <Head><title>Crea tu estudio 3D | Melocotón Move</title><meta name="robots" content="noindex,nofollow" /></Head>
    <div role="status" className="grid min-h-[50vh] place-items-center text-sm text-brand-muted">Preparando tu estudio…</div>
  </>;
  if (isMobile) return <>
    <Head><title>Crea tu estudio 3D | Melocotón Move</title><meta name="robots" content="noindex,nofollow" /><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" /></Head>
    <MobileStudio
      products={products} groups={groups} items={items} visualItems={visualItems}
      selectedId={selectedId} onSelect={setSelectedId}
      add={add} remove={remove} updateSelected={updateSelected} summary={summary} setOrderQuantity={setOrderQuantity}
      matShape={matShape} matColor={matColor} matEnabled={matEnabled} matQuantity={matQuantity}
      updateMat={updateMat} setMatQuantity={setMobileMatQuantity}
      floorColor={floorColor} setFloorColor={setFloorColor} wallColor={wallColor} setWallColor={setWallColor}
      view={view} setView={setView} reset={reset} onReset={() => setReset(n => n + 1)}
      loading={loading} error={error} refresh={() => void refresh()}
    />
  </>;
  return <>
    <Head><title>Crea tu estudio 3D | Melocotón Move</title><meta name="robots" content="noindex,nofollow" /></Head>
    <div className="bg-[#faf8f5] text-brand-ink pb-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-7"><div><p className="mm-eyebrow">Melocotón Move · Demo interactiva</p><h1 className="mm-heading text-4xl sm:text-5xl mt-3">Tu espacio, a tu manera.</h1><p className="mm-copy mt-3">Elige tus accesorios y tapetes y prueba sus colores en tu estudio.</p></div><a href="/arma-tu-studio" className="mm-text-link">Ir al cotizador</a></div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <section aria-label="Diseño de tu estudio" className="lg:sticky lg:top-28 min-w-0">
            <div className="relative"><StudioScene items={visualItems} products={products} mat={matEnabled ? { shape: matShape, color: matColor } : null} selectedId={selectedId} onSelect={setSelectedId} view={view} reset={reset} floorColor={floorColor} wallColor={wallColor} />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-xs">Estudio de muestra · 3 por modelo</span>
              {!items.length && !matEnabled && <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/90 p-4 text-center text-sm pointer-events-none">Tu estudio empieza aquí. Añade un accesorio del catálogo.</div>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3"><button type="button" className="mm-button-outline !px-4" aria-pressed={view === 'perspective'} onClick={() => { setView('perspective'); setReset(n => n + 1); }}>Perspectiva</button><button type="button" className="mm-button-outline !px-4" aria-pressed={view === 'top'} onClick={() => { setView('top'); setReset(n => n + 1); }}>Desde arriba</button><button type="button" className="mm-button-outline !px-4" onClick={() => setReset(n => n + 1)}>Restablecer vista</button></div>
            <p className="text-sm mt-3">Cada modelo seleccionado se representa tres veces. Tapetes en el piso, pelotas en su canasto y accesorios en repisas y soportes. Las cantidades del pedido son independientes de la vista.</p>
            <p className="text-xs text-brand-muted leading-5 mt-3">Arrastra para girar · Pellizca o usa la rueda para acercar · Pasa el cursor o toca un producto para ver su ficha.</p>
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-brand-line bg-white p-4 mt-4">
              <label className="text-sm font-medium">Color del piso<input aria-label="Color del piso" type="color" value={floorColor} onChange={e => setFloorColor(e.target.value)} className="block w-full h-11 mt-2 cursor-pointer rounded-lg" /></label>
              <label className="text-sm font-medium">Color de las paredes<input aria-label="Color de las paredes" type="color" value={wallColor} onChange={e => setWallColor(e.target.value)} className="block w-full h-11 mt-2 cursor-pointer rounded-lg" /></label>
              <p className="col-span-2 text-xs text-brand-muted">Los acabados del espacio son de referencia y no se incluyen en el pedido.</p>
            </div>
            {selected && selectedProduct && <div className="rounded-2xl bg-white border border-brand-line p-5 mt-4">
              <div className="flex justify-between gap-3"><h2 className="font-semibold text-sm">{selectedProduct.name}</h2><button className="text-sm underline min-h-11" onClick={() => remove(selected.id)}>Quitar una unidad</button></div>
              <ColorOptions products={selectedVariants} items={items} excludingId={selected.id} value={`${selected.slug}|${selected.color}`} onChange={(p, color) => updateSelected({ slug: p.slug, color })} />
              <p className="text-xs text-brand-muted mt-1">{colorName(selected.color)} · {money(unitPrice(selectedProduct))}</p>

            </div>}
            <p className="text-xs text-brand-muted leading-5 mt-4">Representaciones simplificadas y medidas de referencia; los tapetes con medidas de empaque se muestran a 67.3 × 181.3 cm. Los pares se añaden como una unidad de venta con dos piezas. Los estampados, marmoleados y acabados muestran el color base registrado; el acabado real se ve en la foto del producto. La vista muestra 3 tapetes de la forma y color elegidos. Cada modelo de accesorio tiene tres representaciones propias, independientes de los otros pesos y diseños: cada modelo muestra un solo color que puedes cambiar con un toque. Las cantidades del pedido no cambian al alternar vistas; las mancuernas y polainas de 1 kg se muestran sobre los tapetes. Las cantidades reales se muestran en el resumen. No se guarda tu diseño al salir.</p>
          </section>
          <aside className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="font-display text-2xl">Accesorios y tapetes</h2><span className="text-xs text-brand-muted">Paso 1 · Diseña</span></div>
            <label className="block text-sm">Buscar producto<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tapete, polainas, mancuernas…" className="mm-field w-full mt-2" /></label>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar catálogo">{[['all', 'Todos'], ['accesorios', 'Accesorios'], ['mat', 'Tapetes']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={filter === value ? 'mm-button !px-4' : 'mm-button-outline !px-4'}>{label}</button>)}</div>
            {(filter === 'all' || filter === 'mat') && (!search.trim() || 'tapetes crea tu mat personalizados'.includes(search.toLowerCase().trim())) && <section className="rounded-2xl border border-brand-line p-4 bg-white" aria-label="Configurar tapetes">
              <h3 className="font-semibold text-base">Tapetes · Crea tu Mat</h3>
              <p className="mt-1 text-xs text-brand-muted">Una sola forma y color para los 3 lugares. Al cambiar una opción se reemplaza el diseño anterior.</p>
              <p className="text-sm font-medium mt-4 mb-2">Forma</p>
              <div className="grid grid-cols-3 gap-2">
                {matShapes.map(option => <button type="button" key={option.id} aria-pressed={matEnabled && matShape === option.id} onClick={() => updateMat({ shape: option.id })} className={`min-h-11 rounded-xl border px-2 py-2 text-sm ${matEnabled && matShape === option.id ? 'border-brand-wine bg-brand-sand' : 'border-brand-line'}`}>{option.label}</button>)}
              </div>
              <p className="text-sm font-medium mt-4 mb-2">Color</p>
              <div className="flex flex-wrap gap-1" aria-label="Colores de Crea tu Mat">
                {solidColors.map(color => <button type="button" key={color} title={solidColorNames[color]} aria-label={solidColorNames[color]} aria-pressed={matEnabled && matColor === color} onClick={() => updateMat({ color })} className={`h-11 w-11 grid place-items-center rounded-full border-2 ${matEnabled && matColor === color ? 'border-brand-wine' : 'border-transparent'}`}><span className="h-7 w-7 rounded-full border border-black/15" style={{ backgroundColor: color }} /></button>)}
              </div>
              <p className="text-xs text-brand-muted mt-2">{solidColorNames[matColor]} · {MAT_DIMENSIONS[matShape].height} × {MAT_DIMENSIONS[matShape].width} cm</p>
              <div className="flex justify-between items-center mt-4 gap-2">
                <span className="text-sm">{money(MAT_PRICE)} / tapete</span>
                {matEnabled ? <button type="button" className="text-sm underline min-h-11" onClick={() => { setMatEnabled(false); setMatQuantity(0); setSelectedId(id => id === 'studio-mat' ? null : id); }}>Quitar tapetes</button> : <button type="button" className="mm-button !px-4" onClick={() => updateMat({})}>Añadir tapetes</button>}
              </div>
            </section>}
            <div className="rounded-2xl border border-brand-line bg-white p-3" aria-label="Catálogo compacto de accesorios">
              <p className="text-xs text-brand-muted mb-2">Elige un producto y toca sus colores. Verás el cambio inmediatamente en el modelo.</p>
              {loading && <p role="status">Cargando catálogo…</p>}
              {error && <div role="alert" className="text-sm">No pudimos cargar los accesorios.<button onClick={() => void refresh()} className="block underline min-h-11">Reintentar</button></div>}
              {!loading && !error && filter !== 'mat' && visibleGroups.length === 0 && <p className="text-sm py-3">No hay accesorios que coincidan con tu búsqueda.</p>}
              {!loading && !error && filter !== 'mat' && <div className="max-h-[340px] overflow-y-auto overscroll-contain space-y-1 pr-1" role="list" aria-label="Productos disponibles">
                {visibleGroups.map(variants => {
                  const key = variants[0].name;
                  const expanded = openProduct === key;
                  return <div key={key} role="listitem" className="rounded-xl border border-brand-line">
                    <button type="button" aria-expanded={expanded} onClick={() => setOpenProduct(expanded ? null : key)} className="w-full min-h-16 flex items-center text-left gap-3 p-2">
                      <img src={variants[0].image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-contain bg-[#faf8f5]" />
                      <span className="flex-1 min-w-0"><span className="block text-sm font-medium leading-5 line-clamp-2">{variants[0].name}</span><span className="text-xs text-brand-muted">{money(Math.min(...variants.map(unitPrice)))} / pieza</span></span>
                      <span aria-hidden="true" className="text-xl text-brand-muted">{expanded ? '−' : '+'}</span>
                    </button>
                    {expanded && <div className="border-t border-brand-line"><ProductPicker variants={variants} items={items} onAdd={add} /></div>}
                  </div>;
                })}
              </div>}
            </div>

            <button type="button" className="mm-button w-full min-h-11" onClick={() => setFinalizing(v => !v)}>{finalizing ? 'Seguir diseñando' : 'Finalizar diseño · Revisar cantidades'}</button>
            {finalizing && <section className="bg-white border border-brand-line rounded-2xl p-5" aria-label="Tu selección">
              <h2 className="font-display text-2xl">Tu estudio está listo</h2><p className="text-xs text-brand-muted mt-2">Cantidades sugeridas según las tres posiciones del modelo. Editarlas no modifica el diseño.</p>
              {!items.length && !matQuantity && <p className="text-sm text-brand-muted mt-3">Añade tu primera pieza para comenzar.</p>}
              {matQuantity > 0 && <div className="border-b border-brand-line py-3">
                <button type="button" className="text-left text-sm leading-5 underline decoration-brand-line" onClick={() => { setFilter('mat'); setSelectedId('studio-mat'); }}>Tapete personalizado · {matShapes.find(s => s.id === matShape)?.label}</button>
                <p className="text-xs text-brand-muted mt-1">{solidColorNames[matColor]} · {money(MAT_PRICE)} / pieza</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3">
                    <button type="button" className="h-11 w-11 border border-brand-line rounded-full" aria-label="Quitar un tapete" onClick={() => { setMatQuantity(q => Math.max(0, q - 1)); if (matQuantity <= 1) setMatEnabled(false); }}>−</button>
                    <span>{matQuantity}</span>
                    <button type="button" className="h-11 w-11 border border-brand-line rounded-full" aria-label="Añadir un tapete" onClick={() => setMatQuantity(q => q + 1)}>+</button>
                  </div>
                  <span className="text-sm">{money(matQuantity * MAT_PRICE)}</span>
                </div>
              </div>}
              <ul className="divide-y divide-brand-line mt-2">{summary.map(([key, row]) => <li key={key} className="py-3"><button className="text-left text-sm leading-5 underline decoration-brand-line" onClick={() => setSelectedId(items.find(i => `${i.slug}|${i.color}` === key)!.id)}>{row.product.name}</button><p className="text-xs text-brand-muted mt-1">{colorName(row.color)} · {money(unitPrice(row.product))} / pieza</p><div className="flex items-center justify-between mt-2"><div className="flex items-center gap-3"><button className="h-11 w-11 border border-brand-line rounded-full" aria-label={`Quitar una pieza de ${row.product.name}, ${colorName(row.color)}`} onClick={() => setOrderQuantity(key, row.quantity - 1)}>−</button><span>{row.quantity}</span><button className="h-11 w-11 border border-brand-line rounded-full disabled:opacity-30" aria-label={`Añadir una pieza de ${row.product.name}, ${colorName(row.color)}`} disabled={row.product.stock != null && row.quantity >= row.product.stock} onClick={() => setOrderQuantity(key, row.quantity + 1)}>+</button></div><span className="text-sm">{money(unitPrice(row.product) * row.quantity)}</span></div></li>)}</ul>
              <div className="flex justify-between border-t border-brand-line pt-4 mt-3 font-semibold"><span>Subtotal estimado</span><span>{money(total)}</span></div><p className="text-xs leading-5 text-brand-muted mt-2">Precios del catálogo, antes de promociones por cantidad. Esta demo no genera pedidos ni reserva inventario. La forma, el color y el precio de los tapetes se toman de Crea tu Mat.</p>
            </section>}
          </aside>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{message}</p>
      </div>
    </div>
  </>;
}
