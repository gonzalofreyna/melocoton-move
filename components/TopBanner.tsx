import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useAppConfig } from "../context/ConfigContext";

export default function TopBanner() {
  const visible = useScrollVisibility();
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

  if (loading || !visible || !enabled || messages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-brand-wine text-white"
    >
      <div className="flex justify-center items-center h-[36px] text-[13px] sm:text-sm font-medium overflow-hidden relative">
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
