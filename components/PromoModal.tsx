import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppConfig } from "../context/ConfigContext";

// === Utilidad de frecuencia ===
function shouldOpen(frequency: "once" | "always" | "daily", key: string) {
  if (frequency === "always") return true;
  const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (!raw) return true;
  if (frequency === "once") return false;
  try {
    const last = new Date(JSON.parse(raw) as string);
    const now = new Date();
    return (
      last.getFullYear() !== now.getFullYear() ||
      last.getMonth() !== now.getMonth() ||
      last.getDate() !== now.getDate()
    );
  } catch {
    return true;
  }
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getTimeLeft(targetMs: number) {
  const now = Date.now();
  const diff = Math.max(0, targetMs - now);
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { diff, days, hours, minutes, seconds };
}

export default function PromoModal() {
  const { config } = useAppConfig();

  // ===== Config lectura
  const enabled = !!config?.promoModal?.enabled;
  const title = config?.promoModal?.title ?? "🎉 Lanzamiento";
  const text =
    config?.promoModal?.text ?? "Novedades y promociones disponibles.";
  const buttonText = config?.promoModal?.buttonText ?? "Ver más";
  const buttonLink = config?.promoModal?.buttonLink ?? "/products";
  const image = config?.promoModal?.image ?? null;
  const imageAlt = config?.promoModal?.imageAlt ?? "Promoción";
  const imageLink = config?.promoModal?.imageLink ?? null;
  const frequency: "once" | "always" | "daily" =
    (config?.promoModal?.frequency as any) ?? "once";
  const storageKey = config?.promoModal?.storageKey ?? "promo_seen_key_v1";

  // Countdown config (nuevo)
  const countdownEnabled = !!config?.promoModal?.countdown?.enabled;
  const launchAtStr = config?.promoModal?.countdown?.launchAt; // ISO string recomendado con zona, ej: "2025-09-15T10:00:00-06:00"
  const afterText =
    config?.promoModal?.countdown?.afterText ?? "¡Disponible ahora!";
  const showWhenExpired = !!config?.promoModal?.countdown?.showWhenExpired; // si true, mostramos afterText; si false, ocultamos el bloque

  // ===== Hooks (orden estable)
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [targetMs, setTargetMs] = useState<number | null>(null);
  const [left, setLeft] = useState(() => ({
    diff: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  }));

  // Parseo del launchAt una vez (o cuando cambie en config)
  useEffect(() => {
    if (launchAtStr) {
      const t = new Date(launchAtStr).getTime();
      setTargetMs(isNaN(t) ? null : t);
    } else {
      setTargetMs(null);
    }
  }, [launchAtStr]);

  // Mostrar modal según frecuencia
  useEffect(() => {
    if (!enabled) return;
    try {
      if (shouldOpen(frequency, storageKey)) {
        setOpen(true);
        localStorage.setItem(
          storageKey,
          JSON.stringify(new Date().toISOString())
        );
      }
    } catch {
      setOpen(true);
    }
  }, [enabled, frequency, storageKey]);

  // Cerrar con ESC / click afuera
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onClick);
      document.body.classList.add("overflow-hidden");
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  // Intervalo del countdown
  useEffect(() => {
    if (!countdownEnabled || !targetMs) return;
    // Primera actualización inmediata
    setLeft(getTimeLeft(targetMs));
    const id = setInterval(() => setLeft(getTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [countdownEnabled, targetMs]);

  if (!enabled) return null;

  const showCountdown = countdownEnabled && targetMs !== null;
  const expired = showCountdown ? left.diff <= 0 : false;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          aria-modal
          role="dialog"
        >
          <motion.div
            ref={wrapperRef}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            {/* Cerrar */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100"
              aria-label="Cerrar promoción"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-gray-500"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Imagen */}
            {image && (
              <a
                href={imageLink ?? buttonLink}
                aria-label={imageAlt}
                className="block"
              >
                <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-56 overflow-hidden">
                  <img
                    src={image}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </a>
            )}

            {/* Contenido */}
            <div className="p-6 md:p-7 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue">
                {title}
              </h2>
              {text && (
                <p className="mt-3 text-gray-600 mx-auto max-w-prose">{text}</p>
              )}

              {/* Countdown */}
              {showCountdown &&
                (expired ? (
                  showWhenExpired ? (
                    <p className="mt-4 text-base font-medium text-brand-blue">
                      {afterText}
                    </p>
                  ) : null
                ) : (
                  <div className="mt-5 flex items-center justify-center">
                    <div className="grid grid-flow-col auto-cols-max gap-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold tabular-nums">
                          {pad(left.days)}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Días
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold tabular-nums">
                          {pad(left.hours)}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Horas
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold tabular-nums">
                          {pad(left.minutes)}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Min
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold tabular-nums">
                          {pad(left.seconds)}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          Seg
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              <div className="mt-6 flex items-center justify-center gap-3">
                <a
                  href={buttonLink}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white hover:bg-brand-beige hover:text-brand-blue transition"
                >
                  {buttonText}
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
