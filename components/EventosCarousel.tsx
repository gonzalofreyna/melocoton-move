import React, { useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { fetchConfig } from "../lib/fetchConfig";

// ===== Tipos locales para esta sección =====
type EventBadge = string | { label: string };
type EventItem = {
  id?: string | number;
  title: string;
  artist?: string;
  date: string;
  city: string;
  venue: string;
  time?: string;
  image: string;
  href?: string;
  badges?: EventBadge[];
};

type EventsConfig = {
  enabled: boolean;
  header?: { title?: string; subtitle?: string };
  seeAll?: { enabled?: boolean; href?: string; label?: string }; // no se usa, solo por compatibilidad
  items: EventItem[];
};

// ===== Utilidades =====
function fmtDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("es-MX", { month: "short" })
    .format(d)
    .replace(".", "");
  const weekday = new Intl.DateTimeFormat("es-MX", { weekday: "short" })
    .format(d)
    .replace(".", "");
  return { day, month: month.toUpperCase(), weekday: weekday.toUpperCase() };
}

function classNames(...xs: string[]) {
  return xs.filter(Boolean).join(" ");
}

// Flechas discretas: tamaño pequeño, ghost, visibles solo on-hover (md+)
const ArrowButton = ({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={direction === "left" ? "Anterior" : "Siguiente"}
    onClick={onClick}
    className={classNames(
      "absolute top-1/2 -translate-y-1/2 z-10",
      "hidden md:flex items-center justify-center",
      "h-8 w-8 rounded-full bg-white/70 ring-1 ring-black/10 shadow-sm",
      "opacity-0 group-hover:opacity-100 transition-opacity",
      direction === "left" ? "left-1" : "right-1"
    )}
  >
    {direction === "left" ? (
      <ChevronLeft size={18} className="text-gray-700" />
    ) : (
      <ChevronRight size={18} className="text-gray-700" />
    )}
  </button>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-xs font-medium text-gray-800">
    {children}
  </span>
);

const EventCard = ({ event }: { event: EventItem }) => {
  const { day, month, weekday } = useMemo(
    () => fmtDate(event.date),
    [event.date]
  );
  const badges = (event.badges || []).map((b) =>
    typeof b === "string" ? { label: b } : b
  );

  return (
    <Link
      href={event.href || "#"}
      className="group/card flex min-w-[320px] max-w-xl snap-start overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-xl"
    >
      {/* Fecha */}
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-gray-50 p-3 text-gray-900">
        <span className="text-[10px] tracking-widest">{weekday}</span>
        <span className="text-4xl font-bold leading-none">
          {String(day).padStart(2, "0")}
        </span>
        <span className="text-sm">{month}</span>
      </div>

      {/* Imagen */}
      <div className="relative mx-3 my-3 h-28 w-40 overflow-hidden rounded-xl">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/card:scale-[1.03]"
          loading="lazy"
        />
      </div>

      {/* Detalles */}
      <div className="mr-4 flex flex-1 flex-col gap-2 py-3 pr-2">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-snug md:text-base">
          {event.title}
        </h3>
        {event.artist && (
          <p className="text-xs font-semibold text-gray-500">{event.artist}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-700">
          <span className="inline-flex items-center gap-1">
            <MapPin size={16} /> {event.city} | {event.venue}
          </span>
          {event.time && (
            <span className="inline-flex items-center gap-1">
              <Clock size={16} /> {event.time}
            </span>
          )}
        </div>
        {badges.length ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <Badge key={i}>{b.label}</Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
};

// ===== Carrusel (presentación) =====
export default function EventosCarousel({
  events = [],
  title = "Eventos",
  className,
}: {
  events: EventItem[];
  title?: string;
  className?: string;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <section className={classNames("w-full", className || "")}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
        </div>
        {/* Botón 'Ver todo' removido intencionalmente */}
      </div>

      {/* group para manejar el hover de las flechas en desktop */}
      <div className="relative group">
        <ArrowButton direction="left" onClick={() => scrollBy(-400)} />
        <ArrowButton direction="right" onClick={() => scrollBy(400)} />

        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2 [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Ocultar scrollbar en webkit */}
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {events.map((ev) => (
            <EventCard key={ev.id ?? `${ev.title}-${ev.date}`} event={ev} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Cargador desde config (CLIENTE) =====
export function EventosFromConfig({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<EventItem[]>([]);
  const [title, setTitle] = useState<string>("Eventos");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await fetchConfig();
        const evCfg = (cfg as any).events as EventsConfig | undefined;

        if (mounted && evCfg) {
          setTitle(evCfg.header?.title || "Eventos");
          if (
            evCfg.enabled &&
            Array.isArray(evCfg.items) &&
            evCfg.items.length > 0
          ) {
            const mapped = evCfg.items.map((it, i) => ({
              id: it.id ?? i,
              title: it.title,
              artist: it.artist,
              date: it.date,
              city: it.city,
              venue: it.venue,
              time: it.time,
              image: it.image,
              href: it.href,
              badges: Array.isArray(it.badges) ? it.badges : [],
            }));
            setItems(mapped);
          }
        }
      } catch (e) {
        console.error("Error cargando events desde config:", e);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Skeleton mientras carga
  if (!loaded) {
    return (
      <section className={className || "w-full py-20 px-6 bg-white"}>
        <div className="mb-4 h-6 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="flex gap-4 overflow-x-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 w-[360px] rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // Placeholder si no hay eventos
  if (items.length === 0) {
    return (
      <section className={className || "w-full py-20 px-6 bg-white"}>
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">{title}</h2>
        <p className="text-gray-500">Próximamente eventos.</p>
      </section>
    );
  }

  // Carrusel con eventos
  return <EventosCarousel className={className} events={items} title={title} />;
}
