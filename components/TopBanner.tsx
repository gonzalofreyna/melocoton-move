import { motion, AnimatePresence } from "framer-motion";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import { useAppConfig } from "../context/ConfigContext"; // <-- leemos el AC del contexto

export default function TopBanner() {
  const visible = useScrollVisibility();
  const { config, loading } = useAppConfig();

  // Mientras carga el AC, no mostramos nada
  if (loading) return null;

  // Verificamos flags y contenido
  const enabled =
    !!config?.featureFlags?.showTopBanner && !!config?.topBanner?.enabled;
  const text = config?.topBanner?.text || "";
  const href = config?.topBanner?.link || null;

  if (!visible || !enabled || !text) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 w-full bg-brand-blue text-white text-center py-2 text-sm font-medium z-50"
      >
        {href ? (
          <a href={href} className="underline underline-offset-2">
            {text}
          </a>
        ) : (
          <span>{text}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
