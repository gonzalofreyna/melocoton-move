import {
  motion,
  AnimatePresence,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useMemo } from "react";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useAppConfig } from "../context/ConfigContext"; // <-- leemos el AC del contexto

export default function TopBanner() {
  const visible = useScrollVisibility();
  const { config, loading } = useAppConfig();
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  // Lee valores del config SIEMPRE antes de cualquier return, para no romper el orden de hooks
  const text = (config?.topBanner?.text ?? "").trim();
  const href = config?.topBanner?.link ?? null;
  const enabled =
    !!config?.featureFlags?.showTopBanner && !!config?.topBanner?.enabled;

  // Calcular duración (seg) de forma estable, sin condicionar hooks
  const duration = useMemo(() => {
    const base = Math.max(8, Math.min(30, Math.round((text.length / 30) * 10)));
    return base;
  }, [text]);

  // Iniciar/pausar animación SIEMPRE desde un hook no condicional
  useEffect(() => {
    // Si no hay texto, no está habilitado, o reduce-motion, no animar
    if (loading || !enabled || !text || prefersReducedMotion) return;
    controls.start({
      x: ["0%", "-50%"],
      transition: { ease: "linear", duration, repeat: Infinity },
    });
    return () => {
      controls.stop();
    };
  }, [controls, duration, enabled, loading, prefersReducedMotion, text]);

  // A partir de aquí sí podemos cortar el render
  if (loading || !visible || !enabled || !text) return null;

  const Content = () => (
    <div className="flex items-center gap-8 pr-8">
      {href ? (
        <a href={href} className="underline underline-offset-2">
          {text}
        </a>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 w-full bg-brand-blue text-white z-50"
      >
        <div className="relative mx-auto max-w-screen-2xl">
          {/* Fader sutil en bordes */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-brand-blue to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-brand-blue to-transparent" />

          <div className="overflow-hidden py-2 text-center text-sm font-medium">
            {/* Pista: dos copias para loop perfecto */}
            <motion.div
              className="flex whitespace-nowrap w-[200%]" // 2x ancho para duplicar contenido
              animate={prefersReducedMotion ? undefined : controls}
              onMouseEnter={() => controls.stop()}
              onMouseLeave={() =>
                controls.start({
                  x: ["0%", "-50%"],
                  transition: { ease: "linear", duration, repeat: Infinity },
                })
              }
            >
              <div className="flex w-1/2 justify-center">
                <Content />
              </div>
              <div className="flex w-1/2 justify-center">
                <Content />
              </div>
            </motion.div>

            {/* Modo reduce-motion: sin animación, mostramos una sola vez */}
            {prefersReducedMotion && (
              <div className="inline-flex items-center gap-2">
                <Content />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
