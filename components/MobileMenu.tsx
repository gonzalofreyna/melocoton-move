// components/MobileMenu.tsx
import { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAppConfig } from "../context/ConfigContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMenu({ open, onClose }: Props) {
  const { config } = useAppConfig();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll al abrir
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  // Fallback estático si no hay navegación en AC
  const staticPrimary = [
    { label: "Inicio", href: "/" },
    {
      label: "Calcetas",
      href: `/products?category=${encodeURIComponent("calcetas")}`,
    },
    {
      label: "Accesorios",
      href: `/products?category=${encodeURIComponent("accesorios")}`,
    },
    {
      label: "Studio Pack",
      href: `/products?category=${encodeURIComponent("studio pack")}`,
    },
    {
      label: "Pilates Reformers",
      href: `/products?category=${encodeURIComponent("reformers")}`,
    },
    {
      label: "Sillas de pilates",
      href: `/products?category=${encodeURIComponent("sillas")}`,
    },
    { label: "Ofertas", href: `/products?onSale=1` },
  ];

  // Mapeo de items del AC a href finales
  const navToHref = (item: any): string => {
    const kind = item?.kind || "link";
    if (kind === "category" && item?.category) {
      return `/products?category=${encodeURIComponent(String(item.category))}`;
    }
    if (kind === "onSale") return "/products?onSale=1";
    if (kind === "popular") return "/products?popular=1";
    if (kind === "freeShipping") return "/products?freeShipping=1";
    // link (o default)
    return item?.href || "/";
  };

  // Primary (barra principal)
  const primaryItems = useMemo(() => {
    const acPrimary =
      config?.navigation?.primary?.filter((i) => i.enabled !== false) || [];
    if (acPrimary.length === 0) return staticPrimary;
    return acPrimary.map((i) => ({
      label: i.label,
      href: navToHref(i),
    }));
  }, [config?.navigation?.primary]);

  // Quick filters (chips)
  const quickItems = useMemo(() => {
    const acQuick =
      config?.navigation?.quickFilters?.filter((i) => i.enabled !== false) ||
      [];
    if (acQuick.length > 0) {
      return acQuick.map((i) => ({ label: i.label, href: navToHref(i) }));
    }
    // fallback a tus tres atajos estándar
    return [
      { label: "Envío gratis", href: "/products?freeShipping=1" },
      { label: "Populares", href: "/products?popular=1" },
      { label: "Mejores ofertas", href: "/products?onSale=1" },
    ];
  }, [config?.navigation?.quickFilters]);

  // Instagram (env o por defecto)
  const IG_USER =
    process.env.NEXT_PUBLIC_IG_USERNAME?.trim() || "melocoton.move";
  const IG_URL =
    process.env.NEXT_PUBLIC_IG_URL?.trim() ||
    `https://instagram.com/${IG_USER}`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <Link
                href="/"
                onClick={onClose}
                aria-label="Inicio"
                className="inline-flex items-center gap-2"
              >
                <img
                  src="/images/logomelocoton.svg"
                  alt="Melocotón Move"
                  className="h-10 w-auto"
                />
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <XMarkIcon className="h-7 w-7 text-brand-blue" />
              </button>
            </div>

            {/* Links principales */}
            <nav className="flex-1 overflow-y-auto px-5 py-3">
              <ul className="space-y-2">
                {primaryItems.map((item) => (
                  <li key={`${item.label}-${item.href}`}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className="w-full text-left py-3 text-xl text-brand-blue hover:text-brand-beige transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Acciones rápidas (chips) */}
              {quickItems.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {quickItems.map((q) => (
                    <button
                      key={`${q.label}-${q.href}`}
                      onClick={() => handleNavigate(q.href)}
                      className="px-3 py-1.5 text-sm rounded-full border text-brand-blue hover:bg-gray-50"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {/* CTA Instagram */}
              <div className="mt-8 rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Síguenos
                </p>
                <a
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-baseline gap-2 text-brand-blue hover:text-brand-beige"
                >
                  <span className="font-medium">@{IG_USER}</span>
                </a>
              </div>
            </nav>

            {/* Footer del drawer */}
            <div className="border-t px-5 py-4 text-xs text-gray-500">
              <p>Envíos rápidos • Pagos seguros • Devoluciones fáciles</p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
