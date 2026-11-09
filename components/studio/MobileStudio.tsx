import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../../lib/fetchProducts';
import { MAT_DIMENSIONS, MAT_PRICE, matShapes, solidColors, solidColorNames, type MatShape } from '../../lib/mat-config';
import { canAdd, colorName, unitPrice, type PreviewMode, type StudioItem, type VisualItem } from '../../lib/studio/catalog';
import StudioScene from './StudioScene';

type Tab = 'accessories' | 'mat' | 'space' | 'order';
type SheetSize = 'compact' | 'half' | 'expanded';
type Props = {
  products: Product[]; groups: Product[][]; items: StudioItem[]; visualItems: VisualItem[];
  selectedId: string | null; onSelect: (id: string | null) => void;
  add: (product: Product, color: string) => void;
  summary: [string, { product: Product; color: string; quantity: number }][];
  setOrderQuantity: (key: string, quantity: number) => void;
  remove: (id: string) => void;
  updateSelected: (change: Partial<StudioItem>) => void;
  previewMode: PreviewMode; setPreviewMode: (mode: PreviewMode) => void;
  matShape: MatShape; matColor: string; matEnabled: boolean; matQuantity: number;
  updateMat: (change: { shape?: MatShape; color?: string }) => void;
  setMatQuantity: (quantity: number) => void;
  floorColor: string; setFloorColor: (color: string) => void;
  wallColor: string; setWallColor: (color: string) => void;
  view: 'perspective' | 'top'; setView: (view: 'perspective' | 'top') => void;
  reset: number; onReset: () => void;
  loading: boolean; error: string | null; refresh: () => void;
};
const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
const tabs: { id: Tab; label: string; symbol: string }[] = [
  { id: 'accessories', label: 'Accesorios', symbol: '◈' },
  { id: 'mat', label: 'Tapetes', symbol: '▱' },
  { id: 'space', label: 'Espacio', symbol: '▧' },
  { id: 'order', label: 'Pedido', symbol: '▤' },
];
const sizeHeight: Record<SheetSize, string> = {
  compact: 'calc(174px + env(safe-area-inset-bottom, 0px))',
  half: '52dvh',
  expanded: '84dvh',
};
const heights: SheetSize[] = ['compact', 'half', 'expanded'];

function Palette({ options, selected, onChange }: {
  options: { product: Product; color: string }[];
  selected: string; onChange: (product: Product, color: string) => void;
}) {
  return <div className="flex flex-wrap gap-1.5" aria-label="Colores del producto">
    {options.map(({ product, color }) => {
      const key = product.slug + '|' + color;
      return <button key={key} type="button" aria-label={colorName(color)} title={colorName(color)}
        aria-pressed={selected === key} onClick={() => onChange(product, color)}
        className={'grid h-11 w-11 place-items-center rounded-full border-2 ' + (selected === key ? 'border-brand-wine' : 'border-transparent')}>
        <span className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: /^#[\da-f]{3,8}$/i.test(color) ? color : '#c5b6a6' }} />
      </button>;
    })}
  </div>;
}

function MobileProduct({ variants, items, add, mode }: {
  variants: Product[]; items: StudioItem[]; add: Props['add']; mode: PreviewMode;
}) {
  const options = variants.flatMap(p => (p.colors.length ? p.colors : ['']).map(color => ({ product: p, color })));
  const selectedKeys = items.filter(i => variants.some(p => p.slug === i.slug)).map(i => i.slug + '|' + i.color);
  const current = options.find(o => selectedKeys.includes(o.product.slug + '|' + o.color)) || options[0];
  return <div className="border-t border-brand-line px-3 pb-3 pt-3">
    <div className="flex gap-3">
      <img src={current.product.image} alt="" className="h-20 w-20 rounded-xl bg-[#faf8f5] object-contain" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{current.product.name}</p>
        <p className="mt-1 text-sm">{money(unitPrice(current.product))} / pieza</p>
        <p className="mt-2 text-xs text-brand-muted">Toca un color y observa cómo cambia el modelo 3D.</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Colores para previsualizar">
      {options.map(({ product, color }) => {
        const key = product.slug + '|' + color;
        const chosen = selectedKeys.includes(key);
        return <button key={key} type="button" onClick={() => add(product, color)}
          aria-label={colorName(color) + (chosen ? ', seleccionado' : '')} aria-pressed={chosen}
          className={'grid h-11 w-11 place-items-center rounded-full border-2 ' + (chosen ? 'border-brand-wine' : 'border-transparent')}>
          <span className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#c5b6a6' }} />
        </button>;
      })}
    </div>
    <p className="mt-2 text-xs text-brand-muted">{mode === 'uniform' ? 'Un color a la vez: tocar otro reemplaza el anterior.' : 'Puedes combinar colores; toca uno seleccionado para quitarlo.'} La cantidad se decide al finalizar.</p>
  </div>;
}

export default function MobileStudio(props: Props) {
  const [tab, setTab] = useState<Tab>('accessories');
  const [sheet, setSheet] = useState<SheetSize>('half');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const scrollArea = useRef<HTMLDivElement>(null);
  const gestureStart = useRef<number | null>(null);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; };
  }, []);

  const active = props.items.find(i => i.id === props.selectedId);
  const activeProduct = props.products.find(p => p.slug === active?.slug);
  const activeVariants = props.groups.find(g => g.some(p => p.slug === active?.slug)) || [];
  const visibleGroups = useMemo(() => props.groups.filter(g =>
    g.some(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [props.groups, search]);
  const summary = props.summary;
  const total = summary.reduce((sum, [, row]) => sum + unitPrice(row.product) * row.quantity, props.matQuantity * MAT_PRICE);
  const count = summary.reduce((sum, [, row]) => sum + row.quantity, props.matQuantity);
  const height = finalizing ? 'calc(100dvh - 56px - env(safe-area-inset-top, 0px))' : sizeHeight[sheet];
  function openSummary() {
    setFinalizing(true);
    setTab('order');
    scrollArea.current?.scrollTo({ top: 0 });
  }
  useEffect(() => {
    if (finalizing) scrollArea.current?.scrollTo({ top: 0 });
  }, [finalizing]);

  function selectTab(next: Tab) {
    setTab(next);
    setSheet(current => current === 'compact' ? 'half' : current);
    scrollArea.current?.scrollTo({ top: 0 });
  }
  function handleSceneSelect(id: string) {
    props.onSelect(id);
    if (id === 'studio-mat') {
      selectTab('mat');
    } else {
      const clicked = props.items.find(i => i.id === id);
      const group = props.groups.find(g => g.some(p => p.slug === clicked?.slug));
      setExpanded(group?.[0]?.name || null);
      selectTab('accessories');
    }
    setSheet('half');
  }
  function handleAdd(p: Product, color: string) {
    props.add(p, color);
    setNotice(p.name + ' · ' + colorName(color) + ' actualizado en el diseño');
    setSheet('half');
  }
  function changeSheetByGesture(delta: number) {
    if (Math.abs(delta) < 35) return;
    setSheet(current => heights[Math.max(0, Math.min(2, heights.indexOf(current) + (delta < 0 ? 1 : -1)))]);
  }

  return <div className="fixed inset-0 z-[60] overflow-hidden bg-[#f5f0e9] text-brand-ink" style={{ height: '100dvh' }}>
    <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-brand-line bg-white/95 px-3 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(56px + env(safe-area-inset-top, 0px))' }}>
      <a href="/" className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm" aria-label="Salir del configurador"><span aria-hidden="true">‹</span> Volver</a>
      <span className="text-sm font-semibold">Crea tu estudio</span>
      <button type="button" onClick={openSummary} className="min-h-11 rounded-xl px-2 text-sm" aria-label="Finalizar diseño">Finalizar</button>
    </header>
    <div className="absolute inset-x-0 z-0 overflow-hidden transition-[bottom] duration-300 ease-out"
      style={{ top: 'calc(56px + env(safe-area-inset-top, 0px))', bottom: height }}>
      <StudioScene fill items={props.visualItems} products={props.products}
        mat={props.matEnabled ? { shape: props.matShape, color: props.matColor } : null}
        selectedId={props.selectedId} onSelect={handleSceneSelect}
        view={props.view} reset={props.reset} floorColor={props.floorColor} wallColor={props.wallColor} />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px]">3 representaciones por modelo</div>
      <div className="absolute right-3 top-3 flex gap-1 rounded-xl bg-white/90 p-1 shadow-sm">
        <button type="button" className="min-h-9 rounded-lg px-2 text-xs" aria-pressed={props.view === 'perspective'}
          onClick={() => props.setView('perspective')}>3D</button>
        <button type="button" className="min-h-9 rounded-lg px-2 text-xs" aria-pressed={props.view === 'top'}
          onClick={() => props.setView('top')}>Arriba</button>
        <button type="button" className="min-h-9 rounded-lg px-2 text-xs" onClick={props.onReset} aria-label="Restablecer cámara">↺</button>
      </div>
      {props.items.length === 0 && !props.matEnabled && <p className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-center text-xs">Elige un accesorio para verlo aquí.</p>}
    </div>
    <section aria-label="Controles de tu estudio" className="absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-3xl border-t border-brand-line bg-white shadow-[0_-12px_36px_rgba(48,41,43,0.13)] transition-[height] duration-300 ease-out"
      style={{ height }}>
      <div className="shrink-0" onPointerDown={e => { gestureStart.current = e.clientY; }}
        onPointerUp={e => { if (gestureStart.current !== null) changeSheetByGesture(e.clientY - gestureStart.current); gestureStart.current = null; }}
        onPointerCancel={() => { gestureStart.current = null; }}>
        <button type="button" onClick={() => setSheet(current => current === 'expanded' ? 'half' : current === 'half' ? 'compact' : 'half')}
          className="flex min-h-10 w-full items-center justify-center" aria-label="Cambiar altura del panel de selección">
          <span className="h-1.5 w-11 rounded-full bg-[#c9b9b0]" />
        </button>
        <div className="flex items-center justify-between px-4 pb-2">
          <div>
            <p className="text-xs text-brand-muted">{finalizing ? 'Paso 2 · Preparar pedido' : 'Paso 1 · Diseña libremente'}</p>
            <p className="text-sm font-semibold">{finalizing ? 'Revisa tus cantidades' : 'Toca colores para verlos en 3D'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border border-brand-line px-3 py-2 text-xs"
              onClick={() => setSheet(current => current === 'expanded' ? 'half' : 'expanded')}>{sheet === 'expanded' ? 'Reducir' : 'Ampliar'}</button>
            <button type="button" className="rounded-lg bg-brand-wine px-3 py-2 text-xs text-white"
              onClick={() => { if (finalizing) { setFinalizing(false); selectTab('accessories'); } else { openSummary(); } }}>{finalizing ? 'Volver al diseño' : 'Finalizar diseño'}</button>
          </div>
        </div>
      </div>
      {!finalizing && <nav className="grid shrink-0 grid-cols-3 gap-1 border-y border-brand-line bg-white px-2 py-1" aria-label="Secciones del configurador">
        {tabs.filter(t => t.id !== 'order').map(t => <button key={t.id} type="button" onClick={() => selectTab(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
          className={'flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-[11px] ' + (tab === t.id ? 'bg-brand-sand font-semibold text-brand-wine' : 'text-brand-muted')}>
          <span className="text-lg leading-5" aria-hidden="true">{t.symbol}</span>{t.label}
        </button>)}
      </nav>}
      <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))', scrollPaddingBottom: '80px' }}>
        {!finalizing && tab === 'accessories' && <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Accesorios</h2>
            <span className="text-xs text-brand-muted">Toca para elegir</span>
          </div>
          <p className="text-xs text-brand-muted">1. Abre un accesorio. 2. Toca un color. 3. Mira el resultado arriba. No necesitas añadir piezas.</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-sand/40 p-1" aria-label="Vista de colores">
            {([{ id: 'uniform', name: 'Uniforme' }, { id: 'multi', name: 'Multicolor' }] as const).map(m =>
              <button key={m.id} className={'min-h-10 rounded-lg text-sm ' + (props.previewMode === m.id ? 'bg-white font-semibold shadow-sm' : '')}
                type="button" aria-pressed={props.previewMode === m.id} onClick={() => props.setPreviewMode(m.id)}>{m.name}</button>)}
          </div>
          {active && activeProduct && <div className="rounded-xl border border-brand-wine/30 bg-brand-sand/40 p-3" aria-label="Editar accesorio seleccionado">
            <div className="flex items-center gap-3">
              <img src={activeProduct.image} alt="" className="h-12 w-12 rounded-lg bg-white object-contain" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">Seleccionado en el modelo</p>
                <p className="truncate text-sm">{activeProduct.name}</p>
              </div>
              <button type="button" className="min-h-10 text-xs underline" onClick={() => props.remove(active.id)}>Quitar</button>
            </div>
            <p className="mt-2 text-xs">Cambiar color de esta unidad:</p>
            <Palette options={activeVariants.flatMap(p => (p.colors.length ? p.colors : ['']).map(color => ({ product: p, color })))}
              selected={active.slug + '|' + active.color}
              onChange={(p, color) => {
                props.updateSelected({ slug: p.slug, color });
              }} />
          </div>}
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mancuernas, bloques, aros…" aria-label="Buscar accesorios"
            className="mm-field min-h-11 w-full" onFocus={() => setSheet('expanded')} />
          {props.loading && <p className="text-sm" role="status">Cargando catálogo…</p>}
          {props.error && <div role="alert" className="text-sm">No pudimos cargar los accesorios. <button onClick={props.refresh} className="underline">Reintentar</button></div>}
          {!props.loading && !props.error && visibleGroups.length === 0 && <p className="text-sm text-brand-muted">No se encontraron accesorios.</p>}
          {!props.loading && !props.error && <div className="space-y-2">
            {visibleGroups.map(variants => {
              const name = variants[0].name;
              const open = expanded === name;
              return <div key={name} className="overflow-hidden rounded-xl border border-brand-line">
                <button type="button" className="flex min-h-[64px] w-full items-center gap-3 p-2 text-left"
                  aria-expanded={open} onClick={() => { setExpanded(open ? null : name); setSheet('half'); }}>
                  <img src={variants[0].image} alt="" loading="lazy" className="h-12 w-12 rounded-lg bg-brand-sand object-contain" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-4">{name}</span>
                    <span className="mt-1 block text-xs text-brand-muted">Desde {money(Math.min(...variants.map(unitPrice)))}</span></span>
                  <span className="px-2 text-lg" aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                {open && <MobileProduct variants={variants} items={props.items} add={handleAdd} mode={props.previewMode} />}
              </div>;
            })}
          </div>}
        </div>}
        {!finalizing && tab === 'mat' && <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tu mat personalizado</h2>
          <p className="text-xs text-brand-muted">Forma y color de Crea tu Mat. Los tres lugares muestran la misma configuración.</p>
          <p className="text-sm font-semibold">Forma</p>
          <div className="grid grid-cols-3 gap-2">{matShapes.map(m => <button type="button" key={m.id} aria-pressed={props.matEnabled && props.matShape === m.id}
            className={'min-h-11 rounded-xl border px-2 text-sm ' + (props.matEnabled && props.matShape === m.id ? 'border-brand-wine bg-brand-sand font-semibold' : 'border-brand-line')}
            onClick={() => props.updateMat({ shape: m.id })}>{m.label}</button>)}</div>
          <p className="text-sm font-semibold">Color: {solidColorNames[props.matColor]}</p>
          <div className="flex flex-wrap gap-1.5">{solidColors.map(c => <button type="button" key={c} aria-label={solidColorNames[c]} title={solidColorNames[c]}
            aria-pressed={props.matEnabled && c === props.matColor} onClick={() => props.updateMat({ color: c })}
            className={'grid h-11 w-11 place-items-center rounded-full border-2 ' + (props.matEnabled && c === props.matColor ? 'border-brand-wine' : 'border-transparent')}>
            <span className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: c }} /></button>)}</div>
          <p className="text-xs text-brand-muted">{MAT_DIMENSIONS[props.matShape].height} × {MAT_DIMENSIONS[props.matShape].width} cm · {money(MAT_PRICE)} por tapete</p>
          <div className="flex items-center justify-between border-t border-brand-line pt-3">
            <span className="text-sm">Cantidad: {props.matQuantity}</span>
            <div className="flex gap-2">
              <button type="button" aria-label="Quitar un tapete" className="h-11 w-11 rounded-full border border-brand-line" onClick={() => props.setMatQuantity(Math.max(0, props.matQuantity - 1))}>−</button>
              <button type="button" aria-label="Añadir un tapete" className="h-11 w-11 rounded-full border border-brand-line" onClick={() => props.setMatQuantity(props.matQuantity + 1)}>+</button>
            </div>
          </div>
        </div>}
        {!finalizing && tab === 'space' && <div className="space-y-4">
          <h2 className="text-lg font-semibold">Personaliza tu espacio</h2>
          <label className="block text-sm">Color del piso
            <input type="color" aria-label="Color del piso" value={props.floorColor} onChange={e => props.setFloorColor(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl" /></label>
          <label className="block text-sm">Color de las paredes
            <input type="color" aria-label="Color de las paredes" value={props.wallColor} onChange={e => props.setWallColor(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl" /></label>
          <p className="text-xs text-brand-muted">Los acabados del espacio son ilustrativos y no se incluyen en el pedido.</p>
        </div>}
        {finalizing && <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tu estudio está listo</h2>
          <p className="text-xs text-brand-muted">Estas son cantidades sugeridas según las tres posiciones del diseño. Ajústalas libremente; no cambiarán la vista 3D.</p>
          {count === 0 && <p className="text-sm text-brand-muted">Todavía no has añadido productos.</p>}
          {props.matQuantity > 0 && <div className="border-b border-brand-line pb-3">
            <p className="text-sm font-semibold">Tapete personalizado · {matShapes.find(m => m.id === props.matShape)?.label}</p>
            <p className="text-xs text-brand-muted">{solidColorNames[props.matColor]} · {money(MAT_PRICE)} / pieza</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><button className="h-11 w-11 rounded-full border border-brand-line" aria-label="Quitar tapete" onClick={() => props.setMatQuantity(Math.max(0, props.matQuantity - 1))}>−</button>
                <span>{props.matQuantity}</span><button className="h-11 w-11 rounded-full border border-brand-line" aria-label="Añadir tapete" onClick={() => props.setMatQuantity(props.matQuantity + 1)}>+</button></div>
              <span className="text-sm">{money(props.matQuantity * MAT_PRICE)}</span>
            </div>
          </div>}
          {summary.map(([key, row]) => <div key={key} className="border-b border-brand-line pb-3">
            <p className="text-left text-sm font-semibold">{row.product.name}</p>
            <p className="text-xs text-brand-muted">{colorName(row.color)} · {money(unitPrice(row.product))} / pieza</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="button" className="h-11 w-11 rounded-full border border-brand-line" aria-label={'Quitar una pieza de ' + row.product.name}
                  onClick={() => props.setOrderQuantity(key, row.quantity - 1)}>−</button>
                <span>{row.quantity}</span>
                <button type="button" className="h-11 w-11 rounded-full border border-brand-line" aria-label={'Añadir una pieza de ' + row.product.name}
                  disabled={row.product.stock != null && row.quantity >= row.product.stock} onClick={() => props.setOrderQuantity(key, row.quantity + 1)}>+</button>
              </div>
              <span className="text-sm">{money(unitPrice(row.product) * row.quantity)}</span>
            </div>
          </div>)}
          <div className="flex items-center justify-between border-t border-brand-line pt-3 text-sm font-semibold">
            <span>Subtotal estimado</span><span>{money(total)}</span>
          </div>
          <p className="text-xs text-brand-muted">El resumen es una cotización preliminar; esta demo aún no envía órdenes ni reserva inventario.</p>

        </div>}
      </div>
      {finalizing && <div className="shrink-0 border-t border-brand-line bg-white px-4 pt-3 shadow-[0_-6px_18px_rgba(48,41,43,0.06)]"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>Subtotal estimado</span><span>{money(total)}</span>
        </div>
        <button type="button" className="mm-button min-h-12 w-full"
          onClick={() => { setFinalizing(false); selectTab('accessories'); }}>
          Seguir diseñando
        </button>
      </div>}
    </section>
    <span className="sr-only" role="status" aria-live="polite">{notice}</span>
  </div>;
}
