import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppConfig } from "../context/ConfigContext";

type Frequency = "once" | "daily" | "always";
function eligible(frequency: Frequency, key: string): boolean {
  if (frequency === "always") return true;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return true;
    if (frequency === "once") return false;
    const previous = new Date(JSON.parse(raw) as string);
    const today = new Date();
    return !Number.isFinite(previous.getTime()) ||
      previous.getFullYear() !== today.getFullYear() ||
      previous.getMonth() !== today.getMonth() ||
      previous.getDate() !== today.getDate();
  } catch {
    return true;
  }
}

export default function PromoModal() {
  const { config } = useAppConfig();
  const promo = config?.promoModal;
  const enabled = !!promo?.enabled;
  const key = promo?.storageKey || "promo_seen_v1";
  const frequency: Frequency = promo?.frequency || "once";
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }
    if (!eligible(frequency, key)) return;
    // A short delay lets customers orient themselves before seeing the offer.
    const timer = window.setTimeout(() => {
      setOpen(true);
      try { localStorage.setItem(key, JSON.stringify(new Date().toISOString())); } catch {}
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [enabled, key, frequency]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]") || [];
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!enabled) return null;
  const destination = promo?.buttonLink || "/crea-tu-mat";
  const image = promo?.image || null;
  const imageAlt = promo?.imageAlt || "Tapete personalizado Melocotón Move";
  const title = promo?.title || "Esta Navidad, regala algo único.";
  const description = promo?.text || "Elige su color favorito, añade su nombre y crea un tapete hecho especialmente para ella.";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-3 py-5 backdrop-blur-[2px] sm:px-6"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          onMouseDown={event => {if(event.target === event.currentTarget) setOpen(false);}}
        >
          <motion.div
            ref={dialogRef}
            role="dialog" aria-modal="true" aria-labelledby="holiday-modal-title" aria-describedby="holiday-modal-description"
            initial={{opacity:0,scale:0.97,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.98,y:10}}
            transition={{duration:0.25}}
            className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[420px] flex-col overflow-y-auto rounded-[24px] bg-[#FCF8F4] shadow-2xl overscroll-contain sm:max-h-[calc(100dvh-3rem)] md:max-w-[820px] md:flex-row"
          >
            <button ref={closeRef} type="button" onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#533A3E] shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#741D32]"
              aria-label="Cerrar promoción">
              <span aria-hidden="true" className="text-2xl leading-none">×</span>
            </button>
            {image ? (
              <>
                {/* Móvil: creativo Story 9:16 sin bordes ni recortes, con CTA superpuesto */}
                <div className="relative w-full md:hidden">
                  <a href={promo?.imageLink || destination} aria-label="Personalizar un tapete para regalar" className="block">
                    <img src={image} alt={imageAlt} className="block h-auto w-full" />
                  </a>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
                  <a href={destination}
                    className="absolute inset-x-5 bottom-4 flex min-h-12 items-center justify-center rounded-full bg-[#741D32] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#60202D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    {promo?.buttonText || "Personalizar un tapete"}
                  </a>
                  <h2 id="holiday-modal-title" className="sr-only">{title}</h2>
                  <p id="holiday-modal-description" className="sr-only">{description}</p>
                </div>
                {/* Escritorio: imagen a la izquierda y contenido a la derecha */}
                <a href={promo?.imageLink || destination} aria-label="Personalizar un tapete para regalar"
                   className="hidden min-h-0 bg-[#F6EDE7] md:flex md:w-[52%] md:items-center md:justify-center">
                  <img src={image} alt={imageAlt} className="block max-h-[min(78dvh,620px)] w-full object-contain" />
                </a>
                <div className="hidden w-full flex-col items-center justify-center px-8 py-9 text-center text-[#50383B] md:flex md:w-[48%]">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#956569]">Navidad con Melocotón</p>
                  <h2 className="font-serif text-4xl leading-[1.12]">{title}</h2>
                  <p className="mt-4 max-w-[290px] text-[15px] leading-relaxed text-[#685356]">{description}</p>
                  <a href={destination}
                    className="mt-6 flex min-h-12 w-full max-w-[290px] items-center justify-center rounded-full bg-[#741D32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#60202D]">
                    {promo?.buttonText || "Personalizar un tapete"}
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-[135px] w-full flex-shrink-0 items-center justify-center bg-gradient-to-br from-[#F4DCD0] to-[#E6A8A7] px-6 text-center sm:h-[170px] md:h-auto md:min-h-[390px] md:w-[52%]">
                  <span className="font-serif text-3xl italic text-[#741D32]">Un regalo muy suyo.</span>
                </div>
                <div className="flex w-full flex-col items-center justify-center px-5 pb-5 pt-3 text-center text-[#50383B] sm:px-8 sm:py-9 md:w-[48%] md:px-9">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#956569]">Navidad con Melocotón</p>
                  <h2 id="holiday-modal-title" className="font-serif text-[29px] leading-[1.12] sm:text-4xl">{title}</h2>
                  <p id="holiday-modal-description" className="mt-4 max-w-[290px] text-[15px] leading-relaxed text-[#685356]">{description}</p>
                  <a href={destination} className="mt-6 flex min-h-12 w-full max-w-[290px] items-center justify-center rounded-full bg-[#741D32] px-6 py-3 text-sm font-semibold text-white">
                    {promo?.buttonText || "Personalizar un tapete"}
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
