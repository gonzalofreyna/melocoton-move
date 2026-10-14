"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useProducts } from "../context/ProductsContext";

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof products>([]);

  // 👉 Filtrar productos según la búsqueda
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    );
  }, [query, products]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-brand-line bg-brand-cream shadow-editorial-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔎 Input de búsqueda */}
        <div className="flex items-center justify-between border-b border-brand-line p-5">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent px-2 text-base text-brand-ink outline-none placeholder:text-brand-muted md:text-lg"
          />
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-black transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* 📦 Resultados */}
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {loading ? (
            <p className="p-4 text-gray-500">Cargando productos...</p>
          ) : error ? (
            <p className="p-4 text-red-500">
              Error cargando productos: {error}
            </p>
          ) : results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`} // 👈 ya sin /products/
                    onClick={onClose}
                    className="flex items-center gap-4 rounded-2xl p-3 transition-colors duration-150 hover:bg-brand-sand"
                  >
                    {/* 🖼️ Imagen */}
                    <div className="flex-shrink-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-16 w-16 rounded-xl border border-brand-line object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* 📋 Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${p.discountPrice ?? p.fullPrice}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query ? (
            <p className="p-6 text-center text-gray-500">
              No encontramos resultados 😢
            </p>
          ) : (
            <p className="p-6 text-center text-gray-400">
              Escribe para buscar...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
