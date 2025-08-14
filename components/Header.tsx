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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const visible = useScrollVisibility();
  const { cartCount } = useCart();
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Cargar productos para sugerencias (como antes)
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

  // Detectar click fuera para cerrar menú (como antes)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (term) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
      setSearchTerm("");
      setShowSuggestions(false);
      // Mantener el foco en el input tras buscar para no "perder" el cursor
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
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="fixed top-8 left-0 w-full z-40 bg-white shadow-md grid grid-cols-3 items-center px-4 md:px-6 py-3 gap-2"
        >
          {/* Columna izquierda: Menú */}
          <div className="flex items-center">
            <button
              className="text-brand-blue focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? (
                <XMarkIcon className="h-8 w-8" />
              ) : (
                <Bars3Icon className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Columna central: Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex justify-center" aria-label="Inicio">
              <img
                src="/images/logoSVG.svg"
                alt="Melocotón Move"
                className="h-14 md:h-16 lg:h-20 w-auto max-h-24 hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Columna derecha: Búsqueda, usuario y carrito */}
          <div className="flex justify-end items-center space-x-4 text-brand-blue relative min-w-0">
            {/* Búsqueda desktop (solo ≥900px) */}
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
                <div className="absolute z-50 top-full left-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-md w-full text-left">
                  {loading ? (
                    <p className="px-4 py-2 text-sm text-gray-500">Cargando…</p>
                  ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item) => (
                      <button
                        key={item.slug}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          router.push(
                            `/products?search=${encodeURIComponent(item.name)}`
                          );
                          setSearchTerm("");
                          setShowSuggestions(false);
                          requestAnimationFrame(() =>
                            inputRef.current?.focus()
                          );
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        aria-label={`Buscar ${item.name}`}
                        type="button"
                      >
                        {item.name}
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

            {/* Usuario */}
            <Link href="/contact" aria-label="Contacto">
              <UserIcon className="h-7 w-7 hover:text-brand-beige transition-colors" />
            </Link>

            {/* Carrito con badge */}
            <div className="relative">
              <Link href="/cart" aria-label="Carrito">
                <ShoppingCartIcon className="h-7 w-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-beige text-brand-blue text-xs font-bold rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Buscador mobile (≤899px) en su propia fila */}
          <div className="min-[900px]:hidden col-span-3 px-2 mt-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring focus:border-brand-blue"
                aria-label="Buscar productos"
                autoComplete="off"
              />
              <button
                onClick={handleSearch}
                aria-label="Buscar"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                type="button"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </button>
              {/* (Si quieres dropdown de sugerencias también aquí, lo duplicamos tal cual) */}
            </div>
          </div>

          {/* Menú desplegable */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-0 w-56 bg-white shadow-md flex flex-col items-start py-4 px-6"
              >
                {[
                  { href: "/", label: "Inicio" },
                  {
                    href: `/products?category=${encodeURIComponent(
                      "calcetas"
                    )}`,
                    label: "Calcetas",
                  },
                  {
                    href: `/products?category=${encodeURIComponent(
                      "accesorios"
                    )}`,
                    label: "Accesorios",
                  },
                  {
                    href: `/products?category=${encodeURIComponent(
                      "studio pack"
                    )}`,
                    label: "Studio Pack",
                  },
                  {
                    href: `/products?category=${encodeURIComponent(
                      "reformers"
                    )}`,
                    label: "Pilates Reformers",
                  },
                  {
                    href: `/products?category=${encodeURIComponent("sillas")}`,
                    label: "Sillas de pilates",
                  },
                  {
                    href: `/products?category=${encodeURIComponent("ofertas")}`,
                    label: "Ofertas",
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="py-2 text-brand-blue hover:text-brand-beige w-full no-underline transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
