import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useAppConfig } from "../context/ConfigContext";

export default function TopBanner() {
  const visible = useScrollVisibility();
  const reducedMotion = useReducedMotion();
  const { config, loading } = useAppConfig();
  const messages = config?.topBanner?.messages ?? [];
  const enabled =
    !!config?.featureFlags?.showTopBanner && !!config?.topBanner?.enabled;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || messages.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // cambia cada 4 segundos
    return () => clearInterval(interval);
  }, [messages, enabled]);

  if (loading || !enabled || messages.length === 0) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? "0%" : "-110%" }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      aria-hidden={!visible}
      className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-brand-wine text-white"
    >
      <div className="relative flex h-[36px] items-center justify-center overflow-hidden px-3 text-center text-[11px] font-medium tracking-[0.045em] sm:text-xs">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute"
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
