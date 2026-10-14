"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Categoria = {
  name: string;
  image: string;
  href: string;
  overlay?: string;
};

type CategoriasSectionProps = {
  title?: string;
  categories?: Categoria[];
};

export default function CategoriasSection({
  title = "Melocotón Shop",
  categories = [],
}: CategoriasSectionProps) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <section className="mm-section bg-brand-cream px-4 sm:px-6">
      {/* 🩷 Título principal */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mm-heading mb-10 text-center text-4xl sm:mb-14 sm:text-5xl"
      >
        {title}
      </motion.h2>

      {/* 🧩 Scroll horizontal en móvil / grid en desktop */}
      <div
        className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-7 sm:overflow-visible lg:grid-cols-3 lg:gap-10"
        style={{
          WebkitOverflowScrolling: "touch", // ✅ mantiene el scroll fluido en iOS
          touchAction: "pan-y pan-x", // ✅ permite ambos gestos (vertical y horizontal)
        }}
      >
        {categories.map((cat, idx) => {
          const overlaySrc = cat.overlay || "/images/hover-overlay.svg";
          return (
            <Link
              key={idx}
              href={cat.href}
              className="
    flex-shrink-0
    w-[76%]
    snap-start
    sm:w-auto
    flex
    flex-col
    items-center
    cursor-pointer
    mx-auto
    transition-transform
    duration-700
    ease-out
  "
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileTap={{
                  scale: 0.97,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
                {/* 📸 Imagen cuadrada con overlay */}
                <div
                  className="
                  relative
                  w-full
                  aspect-square
                  rounded-2xl
                  overflow-hidden
                  border border-brand-line
                  shadow-editorial
                  sm:hover:shadow-editorial-lg
                  transition-all
                  duration-700
                  ease-out
                "
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="
                    w-full
                    h-full
                    object-cover
                    rounded-2xl
                    transition-transform
                    duration-700
                    sm:hover:scale-105
                  "
                  />

                  {/* Overlay blanco brillante */}
                  <div
                    className="
                    absolute inset-0 flex items-center justify-center
                    bg-black/0
                    sm:hover:bg-black/20
                    transition-all duration-700
                  "
                  >
                    <img
                      src={overlaySrc}
                      alt={`${cat.name} overlay`}
                      className="
                      opacity-0 sm:hover:opacity-90
                      w-[70%] h-[70%] lg:w-[85%] lg:h-[85%]
                      transition-all duration-700 ease-out
                      filter brightness-[300%] saturate-150
                    "
                    />
                  </div>
                </div>

                {/* 🏷️ Nombre debajo */}
                <p className="mt-5 text-sm sm:text-lg font-medium tracking-[0.03em] text-brand-ink text-center">
                  {cat.name}
                </p>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
