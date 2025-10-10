"use client";

import { motion } from "framer-motion";

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
    <section className="py-24 px-6 bg-white w-full">
      {/* 🩷 Título principal */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-brand-blue mb-16 text-center tracking-tight"
      >
        {title}
      </motion.h2>

      {/* 🧩 Scroll horizontal en móvil / grid en desktop */}
      <div
        className="
          flex
          sm:grid
          gap-6
          sm:gap-10
          lg:gap-20
          sm:grid-cols-2
          lg:grid-cols-3
          overflow-x-auto
          overflow-y-hidden        // 👈 elimina scroll vertical
          sm:overflow-visible
          pb-4
          scrollbar-hide
        "
        style={{
          WebkitOverflowScrolling: "touch", // 👈 mejora arrastre en iOS
          touchAction: "pan-x", // 👈 bloquea desplazamiento vertical
        }}
      >
        {categories.map((cat, idx) => {
          const overlaySrc = cat.overlay || "/images/hover-overlay.svg";
          return (
            <motion.a
              key={idx}
              href={cat.href}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileTap={{
                scale: 0.97,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }} // 👈 animación táctil suave
              className="
                flex-shrink-0
                w-[70%]
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
              {/* 📸 Imagen cuadrada con overlay */}
              <div
                className="
                  relative
                  w-full
                  aspect-square
                  rounded-3xl
                  overflow-hidden
                  shadow-lg
                  sm:hover:shadow-xl  // ✅ hover solo en desktop
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
                    rounded-3xl
                    transition-transform
                    duration-700
                    sm:hover:scale-105  // ✅ hover solo en desktop
                  "
                />

                {/* Overlay blanco brillante */}
                <div
                  className="
                    absolute inset-0 flex items-center justify-center
                    bg-black/0
                    sm:hover:bg-black/20  // ✅ hover solo desktop
                    transition-all duration-700
                  "
                >
                  <img
                    src={overlaySrc}
                    alt={`${cat.name} overlay`}
                    className="
                      opacity-0 sm:hover:opacity-90  // ✅ hover solo desktop
                      w-[70%] h-[70%] lg:w-[85%] lg:h-[85%]
                      transition-all duration-700 ease-out
                      filter brightness-[300%] saturate-150
                    "
                  />
                </div>
              </div>

              {/* 🏷️ Nombre debajo */}
              <p className="mt-5 text-base sm:text-lg font-semibold text-brand-blue text-center">
                {cat.name}
              </p>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
