import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollVisibility } from "../hooks/useScrollVisibility";
import {
  UserIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/router";
import { fetchProducts } from "../lib/fetchProducts";
import type { Product } from "../lib/fetchProducts";
import MobileMenu from "./MobileMenu";
import DesktopNav from "./DesktopNav";
import Logo from "../components/Logo";
import SearchModal from "./SearchModal"; // 👈 importa el nuevo modal

export default function Header({ onHeightChange }: { onHeightChange?: (offset: number) => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSearchModal, setOpenSearchModal] = useState(false); // 👈 nuevo estado

  const visible = useScrollVisibility();
  const { cartCount, toggleCart } = useCart();
  const router = useRouter();
  const isHome = router.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 70);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const overlayHeader = isHome && !scrolled;
  const headerInk = overlayHeader ? "text-white" : "text-brand-blue";

  const inputRef = useRef<HTMLInputElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  // Un header fixed queda fuera del flujo. Medimos su extremo inferior real
  // para que el contenido empiece justo debajo, sin huecos ni solapamientos.
  // offsetTop/offsetHeight ignoran el transform temporal de Framer Motion.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateOffset = () => {
      onHeightChange?.(Math.ceil(header.offsetTop + header.offsetHeight));
    };

    updateOffset();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateOffset)
      : null;
    observer?.observe(header);
    window.addEventListener("resize", updateOffset);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, [visible, onHeightChange]);

  // 🔄 Cargar productos para sugerencias (desktop)
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setAllProducts(data);
      } catch (e) {
        console.error("Error cargando productos en Header", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🧭 Cerrar drawer al navegar
  useEffect(() => {
    const handleRoute = () => setDrawerOpen(false);
    router.events.on("routeChangeStart", handleRoute);
    return () => router.events.off("routeChangeStart", handleRoute);
  }, [router.events]);

  // ⌨️ Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setShowSuggestions(false);
      }
    };
    if (drawerOpen || showSuggestions) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, showSuggestions]);
  // 👆 Cerrar sugerencias al hacer clic fuera del input
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (term) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
      setSearchTerm("");
      setShowSuggestions(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const filteredSuggestions = useMemo(() => {
    if (loading) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return allProducts
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [allProducts, searchTerm, loading]);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.header
            ref={headerRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`fixed left-0 top-9 z-40 grid w-full grid-cols-3 items-center gap-2 px-4 py-2.5 transition-colors duration-300 md:px-6 md:py-3 ${overlayHeader ? "border-b border-transparent bg-transparent text-white [&_nav]:!text-white [&_nav_a]:!text-white" : "border-b border-brand-line bg-white/95 text-brand-blue shadow-[0_4px_22px_rgba(48,41,43,0.06)] backdrop-blur-md"}`}
          >
            {/* 🍑 Columna izquierda: navegación */}
            <div className="flex items-center">
              {/* 🔹 Menú hamburguesa solo visible hasta 1024px */}
              <button
                className={`${headerInk} focus:outline-none lg:hidden`}
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
              >
                {drawerOpen ? (
                  <XMarkIcon className="h-8 w-8" />
                ) : (
                  <Bars3Icon className="h-8 w-8" />
                )}
              </button>

              {/* 🔹 Menú horizontal (solo en escritorio, desde 1024px) */}
              <div className="hidden lg:flex ml-6">
                <DesktopNav />
              </div>
            </div>

            {/* 🩷 Logo central */}
            <div className="flex justify-center items-center col-span-1 relative">
              <Link
                href="/"
                className="flex items-center justify-center"
                aria-label="Inicio"
              >
                <Logo tone={overlayHeader ? "light" : "dark"} className="h-auto w-[165px] transition-opacity hover:opacity-80 sm:w-[209px] lg:w-[231px]" />
              </Link>
            </div>

            {/* 🔍 Columna derecha: búsqueda y acciones */}
            <div className={`flex justify-end items-center gap-3 sm:gap-4 ${headerInk} relative min-w-0`}>
              {/* 🔎 Búsqueda desktop */}
              <div className={`relative ${overlayHeader ? "hidden" : "hidden min-[900px]:block"} w-[220px] lg:w-[280px] xl:w-[320px] flex-shrink-0`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar..."
                  className="mm-field w-full rounded-full border-brand-line px-4 py-2 text-sm focus:border-brand-wine"
                  aria-label="Buscar productos"
                  autoComplete="off"
                />
                <button
                  onClick={handleSearch}
                  aria-label="Buscar"
                  className="absolute right-2 top-1"
                  type="button"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                </button>

                {showSuggestions && searchTerm && (
                  <div className="absolute left-0 top-full z-50 mt-2 max-h-96 w-full divide-y divide-brand-line overflow-y-auto rounded-2xl border border-brand-line bg-white text-left shadow-editorial-lg">
                    {loading ? (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        Cargando…
                      </p>
                    ) : filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((p) => (
                        <button
                          key={p.slug}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            router.push(`/${p.slug}`); // 👈 redirige directo al producto
                            setSearchTerm("");
                            setShowSuggestions(false);
                            requestAnimationFrame(() =>
                              inputRef.current?.focus(),
                            );
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-all text-sm"
                          type="button"
                          aria-label={`Ver ${p.name}`}
                        >
                          {/* 🖼️ Imagen */}
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            loading="lazy"
                          />

                          {/* 📋 Texto */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium text-gray-800 truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${p.discountPrice ?? p.fullPrice}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        Sin resultados
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 🔍 Ícono búsqueda móvil */}
              <button
                onClick={() => setOpenSearchModal(true)}
                className={overlayHeader ? "block" : "block min-[900px]:hidden"}
                aria-label="Abrir búsqueda"
              >
                <MagnifyingGlassIcon className="h-7 w-7 hover:text-brand-beige transition-colors" />
              </button>

              {/* 👤 Contacto */}
              <Link href="/contact" aria-label="Contacto">
                <UserIcon className="hidden h-7 w-7 hover:text-brand-beige transition-colors sm:block" />
              </Link>

              {/* 🛒 Carrito (solo visible en escritorio) */}
              <button
                onClick={toggleCart}
                aria-label="Abrir carrito"
                className="relative block" // carrito visible en header editorial
              >
                <ShoppingCartIcon className="h-7 w-7 hover:text-brand-beige transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-beige text-brand-blue text-xs font-bold rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* 📂 Drawer menú móvil */}
      <MobileMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* 🔍 Modal de búsqueda solo móvil */}
      <SearchModal
        open={openSearchModal}
        onClose={() => setOpenSearchModal(false)}
      />
    </>
  );
}
