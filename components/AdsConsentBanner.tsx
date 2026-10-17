import Link from "next/link";
import { useEffect, useState } from "react";

export const ADS_CONSENT_KEY = "melocoton_ads_consent_v1";
export const ADS_CONSENT_EVENT = "melocoton:ads-consent";
export const ADS_PREFERENCES_EVENT = "melocoton:ads-preferences";

type Choice = "accepted" | "rejected" | null;
declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

function startPixel() {
  if (process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ENABLED !== "true") return;
  if (window.oaiq) return;
  const q = ((...args: unknown[]) => { q.q.push(args); }) as ((...args: unknown[]) => void) & { q: unknown[][] };
  q.q = [];
  window.oaiq = q;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
  script.id = "openai-ads-pixel";
  document.head.appendChild(script);
  q("consent", false);
  q("init", { pixelId: "TVeQMpjz2WRGsjw89bLGSF", debug: false });
  q("consent", true);
}

export default function AdsConsentBanner() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(ADS_CONSENT_KEY); } catch {}
    const initial: Choice = stored === "accepted" || stored === "rejected" ? stored : null;
    setOpen(initial === null);
    setReady(true);
    if (initial === "accepted") {
      startPixel();
      window.dispatchEvent(new Event(ADS_CONSENT_EVENT));
    }
    const show = () => setOpen(true);
    window.addEventListener(ADS_PREFERENCES_EVENT, show);
    return () => window.removeEventListener(ADS_PREFERENCES_EVENT, show);
  }, []);

  const choose = (next: Exclude<Choice, null>) => {
    try { localStorage.setItem(ADS_CONSENT_KEY, next); } catch {}
    setOpen(false);
    if (next === "accepted") {
      startPixel();
      if (process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ENABLED === "true") window.oaiq?.("consent", true);
    }
    else window.oaiq?.("consent", false);
    window.dispatchEvent(new Event(ADS_CONSENT_EVENT));
  };

  if (!ready || !open) return null;

  return (
    <section
      role="dialog"
      aria-label="Preferencias de privacidad"
      aria-modal="false"
      className="fixed inset-x-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-lg rounded-2xl border border-brand-blue/10 bg-white px-4 py-4 text-brand-ink shadow-2xl sm:bottom-6 sm:px-6 sm:py-5"
    >
      <h2 className="text-base font-semibold">Tu privacidad importa</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Usamos cookies necesarias para el funcionamiento de la tienda y, con tu permiso,
        herramientas para medir el rendimiento de nuestros anuncios.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Puedes cambiar tu elección cuando quieras. Consulta nuestro{" "}
        <Link href="/legal/aviso-de-privacidad" className="underline underline-offset-2">
          aviso de privacidad
        </Link>.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="min-h-11 rounded-xl border border-brand-blue/30 px-3 py-2 text-sm font-semibold text-brand-blue"
        >
          Solo necesarias
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="min-h-11 rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold text-white"
        >
          Aceptar todas
        </button>
      </div>
    </section>
  );
}
