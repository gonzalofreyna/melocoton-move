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

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSearchModal, setOpenSearchModal] = useState(false); // 👈 nuevo estado

  const visible = useScrollVisibility();
  const { cartCount, toggleCart } = useCart();
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement | null>(null);

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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="fixed top-8 left-0 w-full z-40 bg-white shadow-md grid grid-cols-3 items-center px-4 md:px-6 py-3 gap-2"
          >
            {/* 🍑 Columna izquierda: navegación */}
            <div className="flex items-center">
              {/* 🔹 Menú hamburguesa solo visible hasta 1024px */}
              <button
                className="text-brand-blue focus:outline-none lg:hidden"
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
                <Logo className="w-[240px] md:w-[300px] lg:w-[360px] h-auto hover:opacity-90 transition-opacity" />
              </Link>
            </div>

            {/* 🔍 Columna derecha: búsqueda y acciones */}
            <div className="flex justify-end items-center space-x-4 text-brand-blue relative min-w-0">
              {/* 🔎 Búsqueda desktop */}
              <div className="relative hidden min-[900px]:block w-[220px] lg:w-[280px] xl:w-[320px] flex-shrink-0">
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
                  className="w-full border border-gray-300 rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring focus:border-brand-blue"
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
                  <div className="absolute z-50 top-full left-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-xl w-full text-left max-h-96 overflow-y-auto divide-y divide-gray-100">
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
                              inputRef.current?.focus()
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
                className="block min-[900px]:hidden"
                aria-label="Abrir búsqueda"
              >
                <MagnifyingGlassIcon className="h-7 w-7 hover:text-brand-beige transition-colors" />
              </button>

              {/* 👤 Contacto */}
              <Link href="/contact" aria-label="Contacto">
                <UserIcon className="h-7 w-7 hover:text-brand-beige transition-colors" />
              </Link>

              {/* 🛒 Carrito (solo visible en escritorio) */}
              <button
                onClick={toggleCart}
                aria-label="Abrir carrito"
                className="relative hidden min-[900px]:block" // 👈 se oculta en móvil
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
