import {
  motion,
  AnimatePresence,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useMemo } from "react";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useAppConfig } from "../context/ConfigContext";
export default function TopBanner() {
  const visible = useScrollVisibility();
  const { config, loading } = useAppConfig();
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const text = (config?.topBanner?.text ?? "").trim();
  const href = config?.topBanner?.link ?? null;
  const enabled =
    !!config?.featureFlags?.showTopBanner && !!config?.topBanner?.enabled;
  const duration = useMemo(() => {
    const base = Math.max(8, Math.min(30, Math.round((text.length / 30) * 10)));
    return base;
  }, [text]);
  useEffect(() => {
    if (loading || !enabled || !text || prefersReducedMotion) return;
    controls.start({
      x: ["0%", "-50%"],
      transition: { ease: "linear", duration, repeat: Infinity },
    });
    return () => controls.stop();
  }, [controls, duration, enabled, loading, prefersReducedMotion, text]);
  if (loading || !visible || !enabled || !text) return null;
  const Content = () => (
    <div className="flex items-center justify-center gap-4 sm:gap-8 pr-4 sm:pr-8 whitespace-nowrap">
      {" "}
      {href ? (
        <a
          href={href}
          className="inline-block underline underline-offset-2 hover:opacity-90 transition-opacity"
        >
          {" "}
          {text}{" "}
        </a>
      ) : (
        <span className="inline-block">{text}</span>
      )}{" "}
    </div>
  );
  return (
    <AnimatePresence>
      {" "}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 w-full animate-gradient text-white z-50 min-h-[36px] sm:min-h-0"
      >
        {" "}
        <div className="relative mx-auto max-w-screen-2xl">
          {" "}
          {/* 🧭 Contenido */}{" "}
          <div className="overflow-hidden flex items-center justify-center text-center text-[13px] sm:text-sm leading-[1.35] font-medium h-[36px] sm:h-auto">
            {" "}
            {/* 🔁 Marquee en móvil */}{" "}
            <div className="w-full sm:hidden">
              {" "}
              <motion.div
                className="flex whitespace-nowrap w-[200%] will-change-transform"
                animate={prefersReducedMotion ? undefined : controls}
                onMouseEnter={() => controls.stop()}
                onMouseLeave={() =>
                  controls.start({
                    x: ["0%", "-50%"],
                    transition: { ease: "linear", duration, repeat: Infinity },
                  })
                }
              >
                {" "}
                <div className="flex w-1/2 justify-center">
                  {" "}
                  <Content />{" "}
                </div>{" "}
                <div className="flex w-1/2 justify-center">
                  {" "}
                  <Content />{" "}
                </div>{" "}
              </motion.div>{" "}
            </div>{" "}
            {/* 🖥️ Texto estático (desktop) */}{" "}
            <div className="hidden sm:flex justify-center items-center w-full">
              {" "}
              <Content />{" "}
            </div>{" "}
            {/* ♿ Modo reduce-motion */}{" "}
            {prefersReducedMotion && (
              <div className="inline-flex items-center gap-2">
                {" "}
                <Content />{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </motion.div>{" "}
    </AnimatePresence>
  );
}
